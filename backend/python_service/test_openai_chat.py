# test_openai_chat.py
from openai import OpenAI
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("⚠️ OPENAI_API_KEY not found. Set it in your environment or .env file.")
    exit(1)

# Initialize client
client = OpenAI(api_key=api_key)

# Simple loop to chat with AI
print("Chat with AI (type 'exit' to quit):")
while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": user_input}],
            temperature=0.7,  # Optional: controls randomness
            max_tokens=150    # Optional: limits response length
        )
        # Extract AI message
        ai_message = response.choices[0].message.content
        print(f"AI: {ai_message}\n")

    except Exception as e:
        print(f"⚠️ Error: {e}")
        break
