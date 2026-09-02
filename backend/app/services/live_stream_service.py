from __future__ import annotations
import datetime
import logging
from pathlib import Path
from uuid import uuid4
import wave

from fastapi import UploadFile
from mutagen import File as MutagenFile
from mutagen.wave import WAVE

from app.core.config import settings
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB
from app.services.audio_analysis_service import DemoAudioDetector
from app.services.risk_engine import RiskEngine
from app.services.social_engineering_service import SocialEngineeringService
from app.services.transcription_service import TranscriptionService

logger = logging.getLogger(__name__)

SUPPORTED_LIVE_AUDIO_EXTENSIONS = {".wav", ".webm", ".ogg", ".mp3", ".mp4", ".aac"}


class LiveStreamService:
    """Orchestrates near-real-time audio processing for the Live Stream Inspector.

    Reuses the core SentinelAI AI detection pipeline:
    1. DemoAudioDetector for acoustic voice authenticity heuristics.
    2. TranscriptionService for live speech-to-text.
    3. SocialEngineeringService for linguistic threat vector extraction.
    4. RiskEngine for multimodal voice + language risk calculation.
    """

    def __init__(self):
        # Models and services are loaded ONCE at initialization, not reloaded per chunk
        self.detector = DemoAudioDetector()
        self.transcription = TranscriptionService()
        self.social_engineering = SocialEngineeringService()
        self.risk_engine = RiskEngine()

        self.live_upload_dir = Path(settings.upload_dir) / "live"
        self.live_upload_dir.mkdir(parents=True, exist_ok=True)

    def _extract_chunk_metadata(self, chunk_path: Path) -> dict:
        """Extract metadata from chunk with resilient fallback to wave / file stats."""
        try:
            audio_file = MutagenFile(chunk_path)
            if audio_file is not None and getattr(audio_file, "info", None):
                info = audio_file.info
                duration = float(getattr(info, "length", 0.0) or 0.0)
                sample_rate = int(getattr(info, "sample_rate", 0) or 16000)
                channels = int(getattr(info, "channels", 0) or 1)
                bitrate = int(getattr(info, "bitrate", 0) or 0)
                return {
                    "duration_seconds": max(0.5, duration),
                    "sample_rate": sample_rate,
                    "channels": channels,
                    "format": chunk_path.suffix.lower().lstrip("."),
                    "bitrate_kbps": int(bitrate / 1000) if bitrate else 128,
                    "file_size_bytes": chunk_path.stat().st_size,
                }
        except Exception:
            pass

        # Fallback for standard WAV files
        try:
            with wave.open(str(chunk_path), "rb") as wf:
                channels = wf.getnchannels()
                sample_rate = wf.getframerate()
                n_frames = wf.getnframes()
                duration = float(n_frames) / float(sample_rate) if sample_rate > 0 else 5.0
                return {
                    "duration_seconds": max(0.5, duration),
                    "sample_rate": sample_rate,
                    "channels": channels,
                    "format": "wav",
                    "bitrate_kbps": int(sample_rate * channels * 16 / 1000),
                    "file_size_bytes": chunk_path.stat().st_size,
                }
        except Exception:
            pass

        # Safe default estimate for 5s live audio chunks
        return {
            "duration_seconds": 5.0,
            "sample_rate": 16000,
            "channels": 1,
            "format": chunk_path.suffix.lower().lstrip(".") or "wav",
            "bitrate_kbps": 128,
            "file_size_bytes": chunk_path.stat().st_size if chunk_path.exists() else 160000,
        }

    async def process_live_chunk(
        self,
        file: UploadFile,
        session_id: str,
        chunk_index: int,
        client_transcript: str | None,
        user_id: str,
    ) -> dict:
        """Process an audio segment through the multimodal SentinelAI detection pipeline."""
        if not file.filename and not file.content_type:
            raise APIException(400, "Audio chunk file is required")

        filename = Path(file.filename or "chunk.wav").name
        suffix = Path(filename).suffix.lower() or ".wav"
        if suffix not in SUPPORTED_LIVE_AUDIO_EXTENSIONS and "audio" not in (file.content_type or ""):
            suffix = ".wav"

        safe_chunk_name = f"chunk_{session_id}_{chunk_index}_{uuid4().hex[:8]}{suffix}"
        temp_destination = self.live_upload_dir / safe_chunk_name

        try:
            # 1. Stream chunk to temporary file
            with temp_destination.open("wb") as buffer:
                while True:
                    chunk = await file.read(8192)
                    if not chunk:
                        break
                    buffer.write(chunk)

            # 2. Extract metadata
            metadata = self._extract_chunk_metadata(temp_destination)

            # 3. Audio Authenticity AI Detection (Reuses DemoAudioDetector)
            deepfake_res = self.detector.analyze(temp_destination, metadata)
            synthetic_prob = round(float(deepfake_res["risk_score"]) / 100.0, 2)
            authentic_prob = round(1.0 - synthetic_prob, 2)

            audio_analysis_out = {
                "synthetic_probability": synthetic_prob,
                "authentic_probability": authentic_prob,
                "risk_score": deepfake_res["risk_score"],
                "confidence": deepfake_res["confidence"],
                "status": deepfake_res["status"],
                "evidence": deepfake_res["evidence"],
            }

            # 4. Speech-to-Text Transcription
            transcription_res = self.transcription.transcribe(
                temp_destination, client_transcript=client_transcript
            )
            transcript_text = transcription_res.get("text", "")

            # 5. Social Engineering NLP Analysis
            social_res = self.social_engineering.analyze_transcript(transcript_text)

            # 6. Multimodal Risk Calculation
            overall_res = self.risk_engine.calculate_overall_risk(
                deepfake_analysis=deepfake_res,
                social_analysis=social_res,
                audio_analysis=metadata,
            )

            now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

            # Structure response
            response = {
                "success": True,
                "session_id": session_id,
                "chunk_index": chunk_index,
                "status": "completed",
                "audio_analysis": audio_analysis_out,
                "transcription": transcription_res,
                "social_engineering": social_res.model_dump() if hasattr(social_res, "model_dump") else social_res.dict(),
                "overall_risk": overall_res,
                "timestamp": now_iso,
            }

            return response

        finally:
            # 7. Privacy & Storage hygiene: delete raw temporary audio chunk
            try:
                if temp_destination.exists():
                    temp_destination.unlink(missing_ok=True)
            except Exception as e:
                logger.warning("Could not unlink temporary chunk: %s", e)

    async def stop_session(self, summary_data: dict, user_id: str) -> dict:
        """Record session termination and persist summary log if database is connected."""
        session_id = summary_data.get("session_id", "unknown")
        now = datetime.datetime.now(datetime.timezone.utc)

        doc = {
            "session_id": session_id,
            "user_id": user_id,
            "media_type": "live_stream",
            "duration_seconds": summary_data.get("duration_seconds", 0),
            "chunks_processed": summary_data.get("chunks_processed", 0),
            "threats_detected": summary_data.get("threats_detected", 0),
            "peak_risk": summary_data.get("peak_risk", 0),
            "final_classification": summary_data.get("final_classification", "LOW"),
            "created_at": now,
        }

        try:
            db = MongoDB.get_db()
            await db["analyses"].insert_one(doc)
        except Exception:
            # Database storage in demo mode is non-fatal
            pass

        return {
            "success": True,
            "message": "Live session stopped successfully",
            "session_id": session_id,
        }
