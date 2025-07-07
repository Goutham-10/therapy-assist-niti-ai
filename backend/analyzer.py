import requests
import os
import json
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
MODEL_NAME = "mistralai/mistral-7b-instruct"

def extract_insights(text: str) -> dict:
    """Extract summary, emotions, and topics from journal entry using LLM."""

    prompt = """
You are a helpful therapy assistant. Analyze the following journal entry and return:
- A brief 1–2 sentence summary
- 2 to 4 emotional states the person might be experiencing
- 2 to 4 relevant topics discussed

Respond ONLY in this JSON format:
{{
  "summary": "...",
  "emotions": ["...", "..."],
  "topics": ["...", "..."]
}}

Journal Entry:
""" + text.strip()

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    try:
        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload)
        res.raise_for_status()
        content = res.json()["choices"][0]["message"]["content"]

        # Parse the model response safely
        insights = json.loads(content.strip())

    except Exception as e:
        print("[Analyzer] Error extracting insights:", e)
        insights = {
            "summary": "Unable to analyze.",
            "emotions": [],
            "topics": []
        }

    insights["date"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return insights
