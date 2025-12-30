import os
import re
from typing import Tuple, Optional

# Lightweight similarity (no torch)
from rapidfuzz import fuzz

# Firebase (optional)
import firebase_admin
from firebase_admin import credentials, firestore

FIREBASE_JSON = os.path.join(
    os.path.dirname(__file__),
    "..", "src", "main", "resources", "firebase-config.json"
)
FIREBASE_JSON = os.path.abspath(FIREBASE_JSON)

db = None

def try_init_firebase():
    global db
    if db:
        return
    try:
        if not firebase_admin._apps:
            if os.path.exists(FIREBASE_JSON):
                cred = credentials.Certificate(FIREBASE_JSON)
                firebase_admin.initialize_app(cred)
                db = firestore.client()
                print("[INFO] Firebase initialized.")
            else:
                print(f"[WARN] Firebase config not found: {FIREBASE_JSON} -> using local KB")
    except Exception as e:
        print(f"[WARN] Firebase init failed: {e} -> using local KB")

try_init_firebase()

# -------------------------
# Local fallback KB
# -------------------------
LOCAL_KB = [
    {
        "user_query": "my roof leaks during heavy rains what should I do",
        "advice": (
            "Inspect for cracks, missing shingles, and clogged gutters. "
            "Apply waterproof membrane, use flashing around joints, "
            "and ensure proper roof slope. Consider a professional inspection."
        )
    },
    {
        "user_query": "how can i make my home more resistant to flooding",
        "advice": (
            "Use flood barriers, seal foundation cracks, install a sump pump with battery backup, "
            "raise electrical outlets, and landscape to direct water away from the house."
        )
    },
    {
        "user_query": "suggest fire safe landscaping for dry climate",
        "advice": (
            "Create defensible space: clear dry brush within 10 meters, "
            "plant low-resin plants, use gravel/mulch firebreaks, and keep gutters clean."
        )
    },
    {
        "user_query": "recommend energy efficient improvements for old windows",
        "advice": (
            "Add weatherstripping, use caulk to seal gaps, install low-E film, "
            "and consider double-glazed window replacements or storm windows."
        )
    }
]

def clean_text(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s

def find_best_match(user_input: str) -> Tuple[Optional[dict], Optional[float]]:
    query = clean_text(user_input)
    candidates = []

    if db:
        try:
            for doc in db.collection("flood_dataset_labels").stream():
                data = doc.to_dict() or {}
                uq = clean_text(data.get("user_query", ""))
                adv = data.get("expected_response") or data.get("advice")
                if uq and adv:
                    candidates.append({"user_query": uq, "advice": adv})
            print("[DEBUG] Candidates loaded from Firestore:", len(candidates))
        except Exception as e:
            print(f"[WARN] Firestore read failed: {e} -> fallback to local KB")

    if not candidates:
        candidates = LOCAL_KB

    best_score = -1
    best_doc = None

    for item in candidates:
        cand = item["user_query"]
        score = fuzz.token_set_ratio(query, cand)
        if score > best_score:
            best_score = score
            best_doc = item

    # ✅ Stronger threshold
    if best_score < 85:
        return None, best_score

    # ✅ Extra keyword relevance filter
    query_words = set(query.split())
    cand_words = set(best_doc["user_query"].split())
    overlap = query_words & cand_words
    if len(overlap) == 0:
        return None, best_score

    return best_doc, best_score
