import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_prompt():
    response = client.get("/prompt")
    assert response.status_code == 200
    assert "prompt" in response.json()

def test_analyze_too_short():
    payload = {
        "raw_input": "Okay",
        "source": "text",
        "user_id": "testuser"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    assert "Entry too short" in response.json()["message"]

    
def test_analyze_too_short():
    payload = {
        "raw_input": "Okay",
        "source": "text",
        "user_id": "testuser"
    }
    response = client.post("/analyze", json=payload)
    assert response.status_code == 200
    assert "Entry too short" in response.json()["message"]

    def test_clients_endpoint():
    response = client.get("/clients")
    assert response.status_code == 200
    assert "clients" in response.json()