from datetime import datetime
from pydantic import BaseModel, Field
from typing import Literal


class AnalysisCreate(BaseModel):
    media_type: Literal["audio", "video", "live"]
    source: str
    prediction: str
    confidence: float = Field(ge=0, le=1)
    details: dict | None = None


class AnalysisOut(BaseModel):
    id: str
    media_type: str
    source: str
    prediction: str
    confidence: float
    details: dict | None = None


class AudioAnalysisResult(BaseModel):
    duration_seconds: float
    sample_rate: int
    channels: int
    format: str
    bitrate_kbps: int | None = None
    file_size_bytes: int


class DeepfakeAnalysisResult(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    confidence: int = Field(ge=0, le=100)
    status: str
    evidence: list[str]


class SocialEngineeringIndicator(BaseModel):
    name: str
    detected: bool
    confidence: int = Field(ge=0, le=100)
    evidence: str


class SocialEngineeringAnalysis(BaseModel):
    risk_score: int = Field(ge=0, le=100)
    risk_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    indicators: list[SocialEngineeringIndicator]


class OverallRiskResult(BaseModel):
    score: int = Field(ge=0, le=100)
    level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    risk_factors: list[str]


class AudioScanResponse(BaseModel):
    success: bool = True
    scan_id: str
    media_type: Literal["audio"]
    status: Literal["completed"]
    demo_mode: bool
    audio_analysis: AudioAnalysisResult
    deepfake_analysis: DeepfakeAnalysisResult
    social_engineering: SocialEngineeringAnalysis
    overall_risk: OverallRiskResult
    created_at: datetime


class LiveAudioAnalysisResult(BaseModel):
    synthetic_probability: float
    authentic_probability: float
    risk_score: int
    confidence: int
    status: str
    evidence: list[str]


class LiveTranscriptionResult(BaseModel):
    text: str
    confidence: float
    status: str = "completed"


class LiveChunkResponse(BaseModel):
    success: bool = True
    session_id: str
    chunk_index: int
    status: str = "completed"
    audio_analysis: LiveAudioAnalysisResult
    transcription: LiveTranscriptionResult
    social_engineering: SocialEngineeringAnalysis
    overall_risk: OverallRiskResult
    timestamp: str


class LiveSessionStopRequest(BaseModel):
    session_id: str
    duration_seconds: float = 0.0
    chunks_processed: int = 0
    threats_detected: int = 0
    peak_risk: int = 0
    final_classification: str = "LOW"


class LiveSessionStopResponse(BaseModel):
    success: bool = True
    message: str
    session_id: str


class ThreatSignalModel(BaseModel):
    type: str
    severity: Literal["low", "medium", "high", "critical"]
    title: str
    description: str
    evidence: str = ""


class ExtractedUrlResult(BaseModel):
    url: str
    risk_score: int
    severity: str
    signals: list[ThreatSignalModel] = []


class CrossChannelCorrelation(BaseModel):
    detected: bool = False
    summary: str = ""
    correlated_vectors: list[str] = []


class EmailThreatRequest(BaseModel):
    sender: str = ""
    subject: str = ""
    body: str


class UrlThreatRequest(BaseModel):
    url: str


class SmsThreatRequest(BaseModel):
    message: str


class ThreatScanResponse(BaseModel):
    success: bool = True
    channel: Literal["email", "url", "sms"]
    risk_score: int
    severity: Literal["SAFE", "LOW", "MEDIUM", "HIGH", "CRITICAL"]
    confidence: int
    signals: list[ThreatSignalModel]
    extracted_urls: list[ExtractedUrlResult] = []
    cross_channel_correlation: CrossChannelCorrelation | None = None
    explanation: str
    recommendations: list[str]
    timestamp: str


