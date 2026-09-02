from __future__ import annotations
import logging
from pathlib import Path

try:
    import speech_recognition as sr
except ImportError:
    sr = None

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Service for transcribing live audio chunks into text.

    Supports native Google Web Speech API via the speech_recognition package,
    with robust error handling for silence, ambient noise, and network limits,
    seamlessly integrating with client-side Web Speech recognition fallback.
    """

    def __init__(self):
        self.recognizer = sr.Recognizer() if sr else None
        if self.recognizer:
            # Optimize recognition parameters for short live chunks
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True

    def transcribe(self, audio_path: Path, client_transcript: str | None = None) -> dict:
        """Transcribe an audio chunk file.

        Args:
            audio_path: Path to the audio file (WAV format preferred).
            client_transcript: Optional transcript captured by the client browser.

        Returns:
            dict containing:
                - text (str): Transcribed text.
                - confidence (float): Recognition confidence score (0.0 to 1.0).
                - status (str): Processing status string.
        """
        # If client already provided a high-quality transcript from browser Speech API
        cleaned_client_text = (client_transcript or "").strip()

        if not self.recognizer:
            return {
                "text": cleaned_client_text,
                "confidence": 0.85 if cleaned_client_text else 0.0,
                "status": "stt_package_not_installed",
            }

        try:
            with sr.AudioFile(str(audio_path)) as source:
                audio_data = self.recognizer.record(source)

            # Transcribe using Google speech recognition
            text = self.recognizer.recognize_google(audio_data)
            cleaned_text = text.strip() if text else ""
            return {
                "text": cleaned_text or cleaned_client_text,
                "confidence": 0.92 if cleaned_text else (0.85 if cleaned_client_text else 0.0),
                "status": "completed",
            }
        except sr.UnknownValueError:
            # Audio was silence, muffled, or no intelligible words spoken in this 5s chunk
            return {
                "text": cleaned_client_text,
                "confidence": 0.85 if cleaned_client_text else 0.0,
                "status": "no_speech_detected" if not cleaned_client_text else "client_speech_used",
            }
        except sr.RequestError as exc:
            logger.warning("Speech recognition service request error: %s", exc)
            return {
                "text": cleaned_client_text,
                "confidence": 0.85 if cleaned_client_text else 0.0,
                "status": "service_unavailable",
            }
        except Exception as exc:
            logger.warning("Audio transcription processing exception: %s", exc)
            return {
                "text": cleaned_client_text,
                "confidence": 0.85 if cleaned_client_text else 0.0,
                "status": "audio_format_unsupported",
            }
