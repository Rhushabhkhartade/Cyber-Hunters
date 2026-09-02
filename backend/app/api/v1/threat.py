"""
Threat Scanner API Routes
POST /api/v1/threat/email  — Email phishing/scam analysis
POST /api/v1/threat/url   — URL heuristic analysis
POST /api/v1/threat/sms   — SMS smishing/scam analysis

All routes are protected by the existing JWT authentication.
Results are stored in MongoDB (threat_scans collection).
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status

from app.api.v1.auth import get_current_user
from app.core.exceptions import APIException
from app.db.mongodb import MongoDB
from app.schemas.analysis import (
    EmailThreatRequest,
    SmsThreatRequest,
    ThreatScanResponse,
    UrlThreatRequest,
)
from app.services.threat_scanner_service import (
    EmailThreatScanner,
    SmsThreatScanner,
    UrlThreatScanner,
)

router = APIRouter(prefix="/threat", tags=["threat"])

# ---------------------------------------------------------------------------
# Shared storage helper
# ---------------------------------------------------------------------------

async def _save_scan_to_history(
    user_id: str,
    result: ThreatScanResponse,
    channel: str,
) -> None:
    """Persist scan metadata to MongoDB. Non-fatal on failure."""
    try:
        db = MongoDB.get_db()
        await db["threat_scans"].insert_one({
            "user_id": user_id,
            "channel": channel,
            "risk_score": result.risk_score,
            "severity": result.severity,
            "confidence": result.confidence,
            "signal_count": len(result.signals),
            # Store only the first signal type as main_threat for indexing
            "main_threat": result.signals[0].type if result.signals else "none",
            "has_extracted_urls": len(result.extracted_urls) > 0,
            "cross_channel_detected": (
                result.cross_channel_correlation.detected
                if result.cross_channel_correlation
                else False
            ),
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        # Storage failure is non-fatal
        pass


# ---------------------------------------------------------------------------
# POST /api/v1/threat/email
# ---------------------------------------------------------------------------

@router.post("/email", response_model=ThreatScanResponse, status_code=status.HTTP_200_OK)
async def scan_email(
    payload: EmailThreatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyze an email for phishing, impersonation, and social engineering threats."""
    body = (payload.body or "").strip()
    if not body:
        raise APIException(400, "Email body is required for analysis")

    if len(body) > 20_000:
        raise APIException(400, "Email body exceeds the maximum allowed length (20,000 characters)")

    try:
        scanner = EmailThreatScanner()
        result = scanner.analyze(
            sender=(payload.sender or "").strip(),
            subject=(payload.subject or "").strip(),
            body=body,
        )
    except ValueError as exc:
        raise APIException(400, str(exc)) from exc
    except Exception as exc:
        raise APIException(500, "Email analysis failed. Please try again.") from exc

    await _save_scan_to_history(current_user["id"], result, "email")
    return result


# ---------------------------------------------------------------------------
# POST /api/v1/threat/url
# ---------------------------------------------------------------------------

@router.post("/url", response_model=ThreatScanResponse, status_code=status.HTTP_200_OK)
async def scan_url(
    payload: UrlThreatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyze a URL for phishing indicators via structural heuristics only."""
    url = (payload.url or "").strip()
    if not url:
        raise APIException(400, "A URL is required for analysis")

    if len(url) > 2_048:
        raise APIException(400, "URL exceeds the maximum allowed length (2,048 characters)")

    # Basic format sanity — must look like a URL
    if not (url.startswith("http://") or url.startswith("https://") or url.startswith("www.")):
        raise APIException(
            400,
            "Please enter a valid URL beginning with http://, https://, or www."
        )

    try:
        scanner = UrlThreatScanner()
        result = scanner.analyze(url)
    except ValueError as exc:
        raise APIException(400, str(exc)) from exc
    except Exception as exc:
        raise APIException(500, "URL analysis failed. Please try again.") from exc

    await _save_scan_to_history(current_user["id"], result, "url")
    return result


# ---------------------------------------------------------------------------
# POST /api/v1/threat/sms
# ---------------------------------------------------------------------------

@router.post("/sms", response_model=ThreatScanResponse, status_code=status.HTTP_200_OK)
async def scan_sms(
    payload: SmsThreatRequest,
    current_user: dict = Depends(get_current_user),
):
    """Analyze an SMS/message for smishing and scam patterns."""
    message = (payload.message or "").strip()
    if not message:
        raise APIException(400, "SMS message is required for analysis")

    if len(message) > 5_000:
        raise APIException(400, "Message exceeds the maximum allowed length (5,000 characters)")

    try:
        scanner = SmsThreatScanner()
        result = scanner.analyze(message)
    except ValueError as exc:
        raise APIException(400, str(exc)) from exc
    except Exception as exc:
        raise APIException(500, "SMS analysis failed. Please try again.") from exc

    await _save_scan_to_history(current_user["id"], result, "sms")
    return result
