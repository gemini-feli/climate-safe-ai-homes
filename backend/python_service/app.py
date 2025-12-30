import os
import io
import time
import traceback
import logging
from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS

import numpy as np
from PIL import Image
from dotenv import load_dotenv

# Firestore search
from firestore_search import find_best_match
from disaster_precautions import DISASTER_PRECAUTIONS  # High/Low/Normal

# TensorFlow
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
try:
    import tensorflow as tf
    tf.config.threading.set_intra_op_parallelism_threads(1)
    tf.config.threading.set_inter_op_parallelism_threads(1)
except Exception as e:
    tf = None
    print(f"⚠️ TensorFlow import failed: {e}")

# OpenAI
from openai import OpenAI

# Flask App
app = Flask(__name__)
CORS(app, origins=["*"], allow_headers=["*"])
logging.basicConfig(level=logging.INFO)
load_dotenv()

# --- Load Disaster Impact Model ---
model = None
class_labels = []
if tf is not None:
    try:
        model = tf.keras.models.load_model("flood_impact_mobilenetv2.h5")
        with open("flood_impact_class_labels.txt") as f:
            class_labels = [line.strip() for line in f]
        print("✅ Disaster impact model loaded:", class_labels)
    except Exception as e:
        print(f"⚠️ Model load error: {e}")

# OpenAI client
openai_client = OpenAI()
def _has_openai_key(): return bool(os.getenv("OPENAI_API_KEY"))

# CSV Knowledge Base
def load_csv_knowledge(csv_filename="hello.csv"):
    records = []
    backend_dir = Path(__file__).resolve().parents[1]
    candidate_paths = [
        backend_dir / csv_filename,
        backend_dir / "resources" / csv_filename,
        backend_dir / "src" / "main" / "resources" / csv_filename,
    ]
    csv_file = next((p for p in candidate_paths if p.exists()), None)
    if not csv_file: return records
    try:
        import csv
        with open(csv_file, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                q = (row.get("query") or row.get("question") or "").strip()
                a = (row.get("advice") or row.get("expected_response") or row.get("answer") or "").strip()
                if q or a: records.append({"query": q, "advice": a})
    except Exception as e:
        print(f"⚠️ CSV load error: {e}")
    return records

CSV_KB = load_csv_knowledge()

# --- Helpers ---
def _tokenize(text: str):
    return [t for t in "".join([c.lower() if c.isalnum() else " " for c in text]).split() if t]

def _score_query_similarity(user_query: str, kb_query: str) -> float:
    uq, kq = _tokenize(user_query), _tokenize(kb_query)
    if not uq or not kq: return 0.0
    overlap = sum(1.0 for t in kq if t in set(uq))
    return overlap / np.sqrt(len(kq) + len(uq)) if overlap > 0 else 0.0

def get_ai_response(messages, fallback_text="AI fallback failed."):
    if not _has_openai_key(): return fallback_text
    try:
        resp = openai_client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, temperature=0.3, max_tokens=512
        )
        return (resp.choices[0].message.content or "").strip()
    except Exception as e:
        print("⚠️ OpenAI error:", e)
        traceback.print_exc()
        return fallback_text

# --- Health Check ---
@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "time": int(time.time()),
        "openai_key": _has_openai_key(),
        "csv_kb_size": len(CSV_KB),
        "model_loaded": model is not None,
        "class_labels": class_labels
    })

# --- Smart Chat ---
@app.route("/smart_chat", methods=["POST"])
def smart_chat():
    try:
        image_file = request.files.get("image")
        user_query = request.form.get("query", "").strip()

        # --- If image uploaded ---
        if image_file:
            try:
                img = Image.open(image_file.stream).convert("RGB")
                img = img.resize((128, 128))
                img_array = np.array(img) / 255.0
                img_array = np.expand_dims(img_array, axis=0)

                # Model prediction
                prediction = model.predict(img_array)
                predicted_idx = int(np.argmax(prediction))
                predicted_impact = class_labels[predicted_idx]
                confidence = float(np.max(prediction))

                # Rename labels
                if predicted_impact.lower() == "normal":
                    predicted_impact = "Normal Cases"
                elif predicted_impact.lower() == "low":
                    predicted_impact = "Low Impact"
                elif predicted_impact.lower() == "high":
                    predicted_impact = "High Impact"

                # --- Get precautions ---
                impact_key = predicted_impact.replace(" Cases", "").replace(" Impact", "")
                precautions_list = []

                if impact_key in DISASTER_PRECAUTIONS:
                    impact_data = DISASTER_PRECAUTIONS[impact_key]
                    # Flatten all disaster-type lists
                    for disaster_type, tips in impact_data.items():
                        precautions_list.extend(tips)
                else:
                    precautions_list = DISASTER_PRECAUTIONS.get("Normal", {}).get("general", [])

                precautions_str = ", ".join(precautions_list)

                # --- AI analysis text ---
                if "High" in predicted_impact:
                    ai_text = (
                        f"⚠️ High Impact detected with {confidence*100:.2f}% confidence. "
                        f"Take immediate action and follow the precautions carefully."
                    )
                elif "Low" in predicted_impact:
                    ai_text = (
                        f"ℹ️ Low Impact detected ({confidence*100:.2f}%). "
                        f"Stay cautious, monitor the situation, and follow the recommended precautions."
                    )
                else:
                    ai_text = (
                        f"✅ Normal situation detected. Minimal risks observed. "
                        f"Follow basic precautions."
                    )

                return jsonify({
                    "type": "image",
                    "prediction": predicted_impact,
                    "impact": f"{predicted_impact} ({confidence*100:.2f}%)",
                    "confidence": confidence,
                    "precautions": precautions_list,
                    "ai_analysis": ai_text
                })

            except Exception as e:
                traceback.print_exc()
                return jsonify({"error": f"Image processing failed: {e}"}), 500

        # --- If text query ---
        if user_query:
            best_s = 0.0
            kb_answer = None

            try:
                best_doc, fs_score = find_best_match(user_query)
                if best_doc:
                    kb_answer = best_doc.get("advice") or best_doc.get("expected_response")
                    best_s = float(fs_score)
            except:
                pass

            if not kb_answer:
                for row in CSV_KB:
                    s = _score_query_similarity(user_query, row.get("query", ""))
                    if s > best_s:
                        best_s = s
                        kb_answer = row.get("advice")

            precautions_list = DISASTER_PRECAUTIONS.get("Normal", {}).get("general", [])
            precautions_str = ", ".join(precautions_list)

            base_system = (
                "You are ClimateSafeAI. Always classify as 'Normal Cases'. "
                "Include practical safety precautions such as monitoring weather, keeping emergency kits, checking electricity, maintaining hygiene, avoiding unnecessary travel."
            )

            enhanced_answer = get_ai_response(
                [
                    {"role": "system", "content": base_system},
                    {"role": "user", "content": f"User asked: {user_query}\nKB: {kb_answer}"}
                ],
                fallback_text=(
                    kb_answer or
                    "🏠 Impact: Normal Cases (100%)\n\n"
                    "💡 Precautions: Monitor weather updates, keep emergency kits, check electricity and water, maintain hygiene, avoid unnecessary travel.\n\n"
                    "📝 AI Analysis: Normal impact detected. Follow the above precautions."
                )
            )

            return jsonify({
                "type": "text",
                "query": user_query,
                "answer": enhanced_answer,
                "impact": "Normal Cases (100%)",
                "precautions": precautions_list,
                "confidence": float(best_s),
                "source": "kb+openai" if kb_answer else "openai"
            })

        return jsonify({"error": "No image or text query received"}), 400

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Server error: {e}"}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
