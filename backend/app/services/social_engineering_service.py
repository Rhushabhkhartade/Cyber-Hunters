from __future__ import annotations
from typing import List

from app.schemas.analysis import SocialEngineeringIndicator, SocialEngineeringAnalysis

KEYWORD_GROUPS = {
    "urgency": [
        "immediately",
        "asap",
        "urgent",
        "right now",
        "without delay",
        "in the next minute",
    ],
    "authority_impersonation": [
        "ceo",
        "director",
        "chief",
        "manager",
        "executive",
        "vp",
        "president",
    ],
    "financial_request": [
        "transfer",
        "wire",
        "payment",
        "account number",
        "routing",
        "send money",
        "invoice",
    ],
    "credential_request": [
        "password",
        "credentials",
        "login",
        "access code",
        "token",
        "ssn",
    ],
    "otp_request": [
        "one-time password",
        "otp",
        "verification code",
        "2fa",
        "two-factor",
    ],
    "threat_or_pressure": [
        "or else",
        "or we",
        "will be shut down",
        "terminate",
        "wipe",
        "hack",
        "force",
    ],
    "impersonation": [
        "i am",
        "this is",
        "from security",
        "from it",
        "from accounting",
        "from payroll",
    ],
    "suspicious_instruction": [
        "ignore the policy",
        "bypass",
        "disable",
        "override",
        "make an exception",
        "skip",
    ],
}

RISK_WEIGHTS = {
    "urgency": 18,
    "authority_impersonation": 18,
    "financial_request": 20,
    "credential_request": 20,
    "otp_request": 15,
    "threat_or_pressure": 22,
    "impersonation": 15,
    "suspicious_instruction": 18,
}


class SocialEngineeringService:
    def analyze_transcript(self, transcript_text: str) -> SocialEngineeringAnalysis:
        raw = transcript_text.strip().lower() if transcript_text else ""
        indicators: List[SocialEngineeringIndicator] = []
        total_score = 0

        if not raw:
            for name in KEYWORD_GROUPS:
                indicators.append(
                    SocialEngineeringIndicator(
                        name=name,
                        detected=False,
                        confidence=0,
                        evidence="No transcript provided.",
                    )
                )
            return SocialEngineeringAnalysis(
                risk_score=0,
                risk_level="LOW",
                indicators=indicators,
            )

        for name, phrases in KEYWORD_GROUPS.items():
            matches = [phrase for phrase in phrases if phrase in raw]
            detected = len(matches) > 0
            confidence = min(100, len(matches) * 30) if detected else 0
            evidence = (
                f"Detected phrases: {', '.join(matches)}." if detected else "No matching phrases found."
            )
            indicators.append(
                SocialEngineeringIndicator(
                    name=name,
                    detected=detected,
                    confidence=confidence,
                    evidence=evidence,
                )
            )
            if detected:
                total_score += RISK_WEIGHTS.get(name, 10) * min(1.0, confidence / 100)

        score = min(100, int(total_score))
        if score >= 75:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MEDIUM"
        else:
            level = "LOW"

        return SocialEngineeringAnalysis(
            risk_score=score,
            risk_level=level,
            indicators=indicators,
        )
