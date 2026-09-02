import os
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.audio_analysis_service import AudioAnalysisService
from app.services.social_engineering_service import SocialEngineeringService
from app.services.risk_engine import RiskEngine
from app.schemas.analysis import SocialEngineeringAnalysis
from app.api.v1.uploads import get_current_user


def create_wav_file(path: Path) -> Path:
    with path.open("wb") as f:
        f.write(b"RIFF")
        f.write((36).to_bytes(4, "little"))
        f.write(b"WAVEfmt ")
        f.write((16).to_bytes(4, "little"))
        f.write((1).to_bytes(2, "little"))
        f.write((1).to_bytes(2, "little"))
        f.write((44100).to_bytes(4, "little"))
        f.write((44100 * 2).to_bytes(4, "little"))
        f.write((2).to_bytes(2, "little"))
        f.write((16).to_bytes(2, "little"))
        f.write(b"data")
        f.write((0).to_bytes(4, "little"))
    return path


def test_social_engineering_detection():
    service = SocialEngineeringService()
    result = service.analyze_transcript("Please transfer the funds immediately or else.")

    assert isinstance(result, SocialEngineeringAnalysis)
    assert result.risk_score > 0
    assert result.risk_level in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    assert any(indicator.detected for indicator in result.indicators)


def test_risk_engine_deterministic_output():
    deepfake = {"risk_score": 50}
    social = SocialEngineeringAnalysis(
        risk_score=50,
        risk_level="HIGH",
        indicators=[],
    )
    audio_analysis = {"sample_rate": 44100, "bitrate_kbps": 192}

    first = RiskEngine.calculate_overall_risk(deepfake, social, audio_analysis)
    second = RiskEngine.calculate_overall_risk(deepfake, social, audio_analysis)

    assert first == second
    assert first["score"] == second["score"]


@pytest.mark.asyncio
async def test_valid_audio_upload(tmp_path):
    temp_file = create_wav_file(tmp_path / "test.wav")
    upload_file = SimpleNamespace(filename="test.wav", file=open(temp_file, "rb"), content_type="audio/wav")
    service = AudioAnalysisService()

    mock_db = MagicMock()
    mock_analyses = MagicMock()
    mock_db.__getitem__.return_value = mock_analyses
    mock_analyses.insert_one.return_value.inserted_id = "id"

    with patch("app.db.mongodb.MongoDB.get_db", return_value=mock_db), patch.object(service, "save_file", return_value=temp_file), patch.object(service, "validate_upload", return_value=temp_file.name):
        result = await service.analyze_audio(upload_file, "test-user")

    assert result["media_type"] == "audio"
    assert "audio_analysis" in result
    assert result["deepfake_analysis"]["status"] == "DEMO"


@pytest.mark.asyncio
async def test_invalid_file_type(tmp_path):
    temp_file = tmp_path / "test.txt"
    temp_file.write_text("not audio")
    upload_file = SimpleNamespace(filename="test.txt", file=open(temp_file, "rb"), content_type="text/plain")
    service = AudioAnalysisService()

    with pytest.raises(Exception) as exc:
        await service.analyze_audio(upload_file, "test-user")

    assert "audio files are supported" in str(exc.value).lower()


@pytest.mark.asyncio
async def test_file_too_large(tmp_path):
    temp_file = tmp_path / "large.wav"
    temp_file.write_bytes(b"0" * (26 * 1024 * 1024))
    upload_file = SimpleNamespace(filename="large.wav", file=open(temp_file, "rb"), content_type="audio/wav")
    service = AudioAnalysisService()

    with pytest.raises(Exception) as exc:
        await service.analyze_audio(upload_file, "test-user")

    assert "cannot exceed" in str(exc.value).lower()


def test_audio_upload_api_response_schema(tmp_path):
    temp_file = create_wav_file(tmp_path / "api_test.wav")
    client = TestClient(app)

    mock_db = MagicMock()
    mock_analyses = MagicMock()
    mock_db.__getitem__.return_value = mock_analyses
    mock_analyses.insert_one.return_value.inserted_id = "inserted"

    def override_get_current_user():
        return {"id": "test-user", "username": "demo", "email": "demo@sentinelai.dev"}

    app.dependency_overrides[get_current_user] = override_get_current_user

    with patch("app.db.mongodb.MongoDB.get_db", return_value=mock_db):
        response = client.post(
            "/api/v1/uploads/audio",
            files={"file": ("api_test.wav", temp_file.open("rb"), "audio/wav")},
        )

    app.dependency_overrides.clear()

    assert response.status_code == 201
    payload = response.json()
    assert payload["media_type"] == "audio"
    assert payload["status"] == "completed"
    assert payload["demo_mode"] is True
    assert "audio_analysis" in payload
    assert "deepfake_analysis" in payload
    assert "social_engineering" in payload
    assert "overall_risk" in payload
