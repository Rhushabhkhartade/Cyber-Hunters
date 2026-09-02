import datetime
import os
from pathlib import Path
from uuid import uuid4

from mutagen import File as MutagenFile
from mutagen.wave import WAVE
from fastapi import UploadFile

from app.core.config import settings
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB
from app.services.risk_engine import RiskEngine
from app.services.social_engineering_service import SocialEngineeringService

SUPPORTED_AUDIO_EXTENSIONS = {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".mp4", ".aac"}
SUPPORTED_AUDIO_MIME_PREFIX = "audio/"


class AudioDetector:
    def analyze(self, audio_path: Path, metadata: dict) -> dict:
        raise NotImplementedError


class DemoAudioDetector(AudioDetector):
    """Demo audio authenticity detector.

    This is a placeholder analysis engine for hackathon demo mode. It is not a
    trained deepfake classifier. The interface is designed so a real model can
    later replace this class without changing the API contract.
    """

    def analyze(self, audio_path: Path, metadata: dict) -> dict:
        score = 10
        if metadata["duration_seconds"] < 2.0:
            score += 12
        if metadata["duration_seconds"] < 0.5:
            score += 10
        if metadata["sample_rate"] and metadata["sample_rate"] < 22050:
            score += 18
        if metadata["channels"] == 1:
            score += 6
        if metadata.get("bitrate_kbps") is not None and metadata["bitrate_kbps"] < 128:
            score += 12

        score = min(max(score, 0), 95)
        confidence = min(100, 50 + int(score * 0.35))

        evidence = []
        if metadata["duration_seconds"] < 2.0:
            evidence.append("Very short audio may reduce detection confidence.")
        if metadata["sample_rate"] < 22050:
            evidence.append("Low sample rate audio is more likely to be synthetic in demo mode.")
        if metadata["channels"] == 1:
            evidence.append("Single-channel recordings are more common in user-submitted voice samples.")
        if metadata.get("bitrate_kbps") is not None and metadata["bitrate_kbps"] < 128:
            evidence.append("Low bitrate may hide compression artifacts.")

        return {
            "risk_score": score,
            "confidence": confidence,
            "status": "DEMO",
            "evidence": evidence or ["Demo analysis uses audio metadata and baseline heuristics."],
        }


class AudioAnalysisService:
    def __init__(self, detector: AudioDetector | None = None):
        self.detector = detector or DemoAudioDetector()
        self.upload_root = Path(settings.upload_dir)
        self.upload_root.mkdir(parents=True, exist_ok=True)

    def validate_upload(self, file: UploadFile) -> Path:
        if not file.filename:
            raise APIException(400, "A filename is required")

        content_type = (file.content_type or "").lower()
        if not content_type.startswith(SUPPORTED_AUDIO_MIME_PREFIX):
            raise APIException(400, "Only audio files are supported")

        name = Path(file.filename).name
        file_extension = Path(name).suffix.lower()
        if file_extension not in SUPPORTED_AUDIO_EXTENSIONS:
            raise APIException(400, "Unsupported audio format")

        try:
            file.file.seek(0, os.SEEK_END)
            size = file.file.tell()
            file.file.seek(0)
        except Exception:
            raise APIException(400, "Unable to determine uploaded file size")

        if size > settings.max_audio_upload_mb * 1024 * 1024:
            raise APIException(413, f"Audio file size cannot exceed {settings.max_audio_upload_mb} MB")

        safe_name = f"{uuid4().hex}{file_extension}"
        return safe_name

    def save_file(self, file: UploadFile, safe_filename: str) -> Path:
        destination = self.upload_root / safe_filename
        with destination.open("wb") as buffer:
            file.file.seek(0)
            while True:
                chunk = file.file.read(8192)
                if not chunk:
                    break
                buffer.write(chunk)
        return destination

    def extract_audio_metadata(self, destination: Path) -> dict:
        audio_file = MutagenFile(destination)
        if audio_file is None or not getattr(audio_file, "info", None):
            if destination.suffix.lower() == ".wav":
                audio_file = WAVE(destination)
            else:
                raise APIException(400, "Unable to read audio metadata")

        info = audio_file.info
        duration_seconds = float(getattr(info, "length", 0.0) or 0.0)
        sample_rate = int(getattr(info, "sample_rate", 0) or 0)
        channels = int(getattr(info, "channels", 0) or 0)
        bitrate = int(getattr(info, "bitrate", 0) or 0)
        return {
            "duration_seconds": duration_seconds,
            "sample_rate": sample_rate,
            "channels": channels,
            "format": destination.suffix.lower().lstrip("."),
            "bitrate_kbps": int(bitrate / 1000) if bitrate else None,
            "file_size_bytes": destination.stat().st_size,
        }

    async def analyze_audio(self, file: UploadFile, user_id: str) -> dict:
        safe_filename = self.validate_upload(file)
        destination = self.save_file(file, safe_filename)
        audio_analysis = self.extract_audio_metadata(destination)

        deepfake_analysis = self.detector.analyze(destination, audio_analysis)
        social_engineering = SocialEngineeringService().analyze_transcript("")
        overall_risk = RiskEngine.calculate_overall_risk(
            deepfake_analysis=deepfake_analysis,
            social_analysis=social_engineering,
            audio_analysis=audio_analysis,
        )

        social_dict = (
            social_engineering.model_dump()
            if hasattr(social_engineering, "model_dump")
            else social_engineering.dict()
            if hasattr(social_engineering, "dict")
            else social_engineering
        )

        now = datetime.datetime.now(datetime.timezone.utc)
        result_doc = {
            "scan_id": uuid4().hex,
            "user_id": user_id,
            "media_type": "audio",
            "filename": safe_filename,
            "created_at": now,
            "analysis_status": "completed",
            "demo_mode": True,
            "audio_analysis": audio_analysis,
            "deepfake_analysis": deepfake_analysis,
            "social_engineering": social_dict,
            "overall_risk": overall_risk,
        }

        try:
            db = MongoDB.get_db()
            doc_to_save = dict(result_doc)
            await db["analyses"].insert_one(doc_to_save)
        except Exception:
            # Storage failure is non-fatal; detection result is preserved
            pass

        return result_doc
