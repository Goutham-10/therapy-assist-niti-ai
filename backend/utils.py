import json
import random
import os

PROMPT_FILE = "prompts/daily_prompts.json"
USED_FILE = "prompt_tracker.json"

def load_daily_prompt():
    with open(PROMPT_FILE, "r",encoding="utf-8") as f:
        prompts = json.load(f)

    if os.path.exists(USED_FILE):
        with open(USED_FILE, "r", encoding="utf-8") as f:
            used = json.load(f)
    else:
        used = []

    unused = [p for p in prompts if p not in used]

    if not unused:  # All prompts used, reset
        unused = prompts
        used = []

    prompt = random.choice(unused)
    used.append(prompt)

    with open(USED_FILE, "w") as f:
        json.dump(used, f)

    return prompt
