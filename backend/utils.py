import json
import random
import os

PROMPT_FILE = "prompts/daily_prompts.json"
USED_FILE = "prompt_tracker.json"

def load_daily_prompt():
    # Load prompt list
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    # Load used prompt tracker
    try:
        if os.path.exists(USED_FILE):
            with open(USED_FILE, "r", encoding="utf-8") as f:
                used = json.load(f)
        else:
            used = []
    except Exception as e:
        print(f"⚠️ Error reading {USED_FILE}: {e}")
        used = []

    # Get unused prompts
    unused = [p for p in prompts if p not in used]

    if not unused:
        unused = prompts
        used = []

    # Select and save prompt
    prompt = random.choice(unused)
    used.append(prompt)

    try:
        with open(USED_FILE, "w", encoding="utf-8") as f:
            json.dump(used, f, ensure_ascii=False, indent=2)
    except Exception as e:
        print(f"⚠️ Error writing {USED_FILE}: {e}")

    return prompt
