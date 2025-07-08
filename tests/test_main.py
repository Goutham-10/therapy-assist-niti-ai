import unittest
from fastapi.testclient import TestClient  # ✅ CORRECT import

import os
from dotenv import load_dotenv
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.main import app  # now this will work


client = TestClient(app)

# Load .env variables
load_dotenv()
THERAPIST_SECRET_KEY = os.getenv("THERAPIST_SECRET_KEY")

class TestTheraPromptAPI(unittest.TestCase):

    def test_get_prompt(self):
        response = client.get("/prompt")
        self.assertEqual(response.status_code, 200)
        self.assertIn("prompt", response.json())

    def test_analyze_entry_short(self):
        response = client.post("/analyze", json={
            "user_id": "test_user",
            "raw_input": "Hi!"
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("summary", response.json())
        self.assertIn("Entry too short", response.json()["summary"])

    def test_post_feedback_invalid(self):
        response = client.post("/feedback", json={
            "entry_id": "000000000000000000000000",
            "feedback": "This is test feedback."
        })
        self.assertIn(response.status_code, [404, 500])

    def test_get_log_recent(self):
        response = client.get("/log")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_get_clients(self):
        response = client.get("/clients")
        self.assertEqual(response.status_code, 200)
        self.assertIn("clients", response.json())

    def test_get_log_by_user(self):
        response = client.get("/log/test_user")
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.json(), list)

    def test_user_stats_missing(self):
        response = client.get("/stats/unknown_user_123")
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())

    def test_therapist_login_success(self):
        response = client.post("/therapist-login", json={"password": THERAPIST_SECRET_KEY})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json().get("status"), "ok")

    def test_therapist_login_failure(self):
        response = client.post("/therapist-login", json={"password": "wrongpassword"})
        self.assertEqual(response.status_code, 401)
        self.assertIn("message", response.json())

if __name__ == "__main__":
    unittest.main()
