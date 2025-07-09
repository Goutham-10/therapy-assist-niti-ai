import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = "mistralai/mistral-7b-instruct"
API_URL = "https://openrouter.ai/api/v1/chat/completions"

# In analyzer.py
def extract_insights(text: str) -> dict:
    """Analyze journal text using LLM and return structured insights."""

    journal_prompt = {
        "role": "user",
        "content": f"""
You are a kind, thoughtful AI assistant helping people reflect on their journal entries. Read the journal below and:

1. Summarize it in 1–2 sentences.
2. Extract 2–4 key emotions.
3. Extract 2–4 relevant topics.
4. Identify 1–2 cognitive distortion patterns (if any).
5. Suggest 2–3 follow-up questions a therapist might ask.
6. Give 1 short gentle self-reflection tip (CBT-style). Example: "Try to reframe 'I'm not good enough' as 'I'm learning slowly and that's okay'."

Respond in this JSON format:
{{
  "summary": "...",
  "emotions": ["..."],
  "topics": ["..."],
  "cognitive_patterns": ["..."],
  "suggested_questions": ["..."],
  "tip": "..."
}}

Journal Entry:
{text.strip()}
"""
    }

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [journal_prompt]
    }

    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        response.raise_for_status()

        raw_content = response.json()["choices"][0]["message"]["content"]
        insights = json.loads(raw_content.strip())

    except Exception as e:
        print("[Analyzer] Error extracting insights:", e)
        insights = {}

    # Ensure all expected fields are present
    defaults = {
        "summary": "Unable to summarize.",
        "emotions": [],
        "topics": [],
        "cognitive_patterns": [],
        "suggested_questions": [],
        "tip": "Reflect on one small thing that went okay today — even if it’s tiny."
    }

    for key, value in defaults.items():
        insights.setdefault(key, value)

    insights["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    return insights
