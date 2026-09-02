"""
Multi-Channel Phishing & Scam Detection Service
================================================
Implements heuristic-based threat analysis for:
  - Suspicious emails (sender, subject, body)
  - Suspicious URLs / websites
  - Suspicious SMS / messages

All detection is rule-based / heuristic. No results are
presented as output of a trained ML model.

Cross-channel correlation: when a URL is found inside an email
or SMS, the URL analysis is merged into the final result.
"""
from __future__ import annotations

import re
from datetime import datetime, timezone
from typing import List

from app.schemas.analysis import (
    CrossChannelCorrelation,
    ExtractedUrlResult,
    ThreatScanResponse,
    ThreatSignalModel,
)
from app.services.social_engineering_service import SocialEngineeringService

# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

_URL_REGEX = re.compile(
    r"https?://[^\s\"'<>\]\[)]+|"
    r"www\.[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}[^\s\"'<>\]\[)]*",
    re.IGNORECASE,
)

_SEVERITY_MAP = {
    "SAFE": 0,
    "LOW": 1,
    "MEDIUM": 2,
    "HIGH": 3,
    "CRITICAL": 4,
}
_SEVERITY_REVERSE = {v: k for k, v in _SEVERITY_MAP.items()}


def _score_to_severity(score: int) -> str:
    if score >= 75:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 35:
        return "MEDIUM"
    if score >= 10:
        return "LOW"
    return "SAFE"


def _extract_urls(text: str) -> List[str]:
    """Return deduplicated list of URLs found in text."""
    found = _URL_REGEX.findall(text)
    seen: set[str] = set()
    unique: List[str] = []
    for url in found:
        url = url.rstrip(".,;:")
        if url not in seen:
            seen.add(url)
            unique.append(url)
    return unique


# ---------------------------------------------------------------------------
# URL Heuristic Scanner
# ---------------------------------------------------------------------------

_LOOKALIKE_BRANDS = [
    "paypal", "paypa1", "paypai", "amazon", "amaz0n", "google",
    "g00gle", "microsoft", "micros0ft", "apple", "appie", "netflix",
    "netfl1x", "bank", "banking", "wellsfargo", "citibank", "chase",
    "hsbc", "barclays", "facebook", "faceb00k", "instagram", "twitter",
    "linkedin", "whatsapp", "ebay", "shopify", "irs", "gov-",
]

_SUSPICIOUS_KEYWORDS_PATH = [
    "login", "signin", "sign-in", "verify", "verification",
    "account", "secure", "security", "update", "confirm",
    "recover", "reset", "password", "credential", "auth",
    "wallet", "banking", "payment", "kyc", "identity",
]

_SUSPICIOUS_TLD = {
    ".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".club",
    ".work", ".date", ".win", ".loan", ".online", ".stream",
    ".racing", ".click", ".link", ".download", ".review",
}

_SHORTENED_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "t.co", "ow.ly",
    "is.gd", "buff.ly", "adf.ly", "j.mp", "dlvr.it",
    "tiny.cc", "tr.im", "clck.ru", "cutt.ly", "shorturl.at",
}

_IP_PATTERN = re.compile(
    r"https?://\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}"
)

_PUNYCODE_PATTERN = re.compile(r"xn--", re.IGNORECASE)

_ENCODED_CHARS = re.compile(r"%[0-9A-Fa-f]{2}")


class UrlThreatScanner:
    """
    Heuristic URL threat analyzer.

    Safely inspects the URL *structure* only — never fetches
    or executes the target URL.
    """

    def analyze(self, url: str) -> ThreatScanResponse:
        url = url.strip()
        if not url:
            raise ValueError("URL must not be empty")

        # Normalise: ensure scheme for parsing
        normalized = url if "://" in url else f"http://{url}"

        signals: List[ThreatSignalModel] = []
        score = 0

        # --- 1. HTTP instead of HTTPS ----------------------------------------
        if normalized.startswith("http://") and not normalized.startswith("https://"):
            signals.append(ThreatSignalModel(
                type="no_https",
                severity="medium",
                title="No HTTPS",
                description="The URL uses unencrypted HTTP. Legitimate services almost always use HTTPS.",
                evidence=url,
            ))
            score += 15

        # --- 2. IP-based URL --------------------------------------------------
        if _IP_PATTERN.match(normalized):
            signals.append(ThreatSignalModel(
                type="ip_based_url",
                severity="high",
                title="IP-Based URL",
                description="The URL uses a raw IP address instead of a domain name. This is a common phishing tactic.",
                evidence=url,
            ))
            score += 30

        # --- 3. Shortened URL -------------------------------------------------
        try:
            domain_part = normalized.split("://", 1)[1].split("/")[0].lower()
        except IndexError:
            domain_part = ""

        if domain_part in _SHORTENED_DOMAINS:
            signals.append(ThreatSignalModel(
                type="shortened_url",
                severity="medium",
                title="Shortened URL",
                description="URL shorteners can hide the true destination. Exercise caution.",
                evidence=domain_part,
            ))
            score += 20

        # --- 4. Suspicious TLD ------------------------------------------------
        tld_match = re.search(r"\.[a-z]{2,8}$", domain_part)
        if tld_match and tld_match.group(0) in _SUSPICIOUS_TLD:
            signals.append(ThreatSignalModel(
                type="suspicious_tld",
                severity="medium",
                title="Suspicious TLD",
                description=f"The domain extension '{tld_match.group(0)}' is frequently associated with free or throwaway domains used in phishing campaigns.",
                evidence=domain_part,
            ))
            score += 18

        # --- 5. Lookalike / Brand Impersonation -------------------------------
        domain_lower = domain_part.lower()
        for brand in _LOOKALIKE_BRANDS:
            if brand in domain_lower:
                # Allow exact official domains (e.g. paypal.com itself)
                if not domain_lower in (f"{brand}.com", f"www.{brand}.com"):
                    signals.append(ThreatSignalModel(
                        type="lookalike_domain",
                        severity="high",
                        title="Lookalike / Brand Impersonation",
                        description=f"The domain appears to impersonate a well-known brand ('{brand}'). Verify the exact spelling carefully.",
                        evidence=domain_part,
                    ))
                    score += 25
                    break  # one match is enough

        # --- 6. Excessive subdomains ------------------------------------------
        subdomain_parts = domain_part.split(".")
        if len(subdomain_parts) > 4:
            signals.append(ThreatSignalModel(
                type="excessive_subdomains",
                severity="medium",
                title="Excessive Subdomains",
                description="Unusually deep subdomain chains are used to disguise a malicious domain behind a legitimate-looking prefix.",
                evidence=domain_part,
            ))
            score += 15

        # --- 7. Punycode / IDN indicators ------------------------------------
        if _PUNYCODE_PATTERN.search(domain_part):
            signals.append(ThreatSignalModel(
                type="punycode_domain",
                severity="high",
                title="Punycode / Homoglyph Domain",
                description="The domain uses punycode encoding, which is sometimes used to create visually identical look-alike domains.",
                evidence=domain_part,
            ))
            score += 25

        # --- 8. Suspicious path keywords -------------------------------------
        try:
            path_part = normalized.split("://", 1)[1].split("/", 1)[1] if "/" in normalized.split("://", 1)[1] else ""
        except IndexError:
            path_part = ""

        path_lower = path_part.lower()
        matched_path_kw = [kw for kw in _SUSPICIOUS_KEYWORDS_PATH if kw in path_lower]
        if matched_path_kw:
            signals.append(ThreatSignalModel(
                type="suspicious_path",
                severity="medium",
                title="Suspicious Path Keywords",
                description="The URL path contains keywords commonly found in phishing pages.",
                evidence=", ".join(matched_path_kw[:5]),
            ))
            score += 12

        # --- 9. Encoded / obfuscated characters in URL ----------------------
        encoded_matches = _ENCODED_CHARS.findall(url)
        if len(encoded_matches) > 3:
            signals.append(ThreatSignalModel(
                type="url_obfuscation",
                severity="medium",
                title="URL Character Obfuscation",
                description="Multiple percent-encoded characters were detected. This can be used to disguise malicious URLs.",
                evidence=url[:80],
            ))
            score += 12

        # --- 10. Suspicious query parameters ---------------------------------
        if "?" in url:
            query = url.split("?", 1)[1]
            suspicious_params = ["redirect", "url=", "next=", "goto=", "return=", "redir="]
            matched_params = [p for p in suspicious_params if p in query.lower()]
            if matched_params:
                signals.append(ThreatSignalModel(
                    type="redirect_param",
                    severity="medium",
                    title="Suspicious Redirect Parameters",
                    description="The URL contains parameters that may be used to redirect users to a different, malicious page.",
                    evidence=query[:80],
                ))
                score += 10

        # --- Score cap & result ----------------------------------------------
        score = min(score, 95)
        severity = _score_to_severity(score)
        confidence = min(95, 40 + int(score * 0.55))

        explanation = _build_url_explanation(score, signals, domain_part)
        recommendations = _build_url_recommendations(signals)

        return ThreatScanResponse(
            success=True,
            channel="url",
            risk_score=score,
            severity=severity,
            confidence=confidence,
            signals=signals,
            explanation=explanation,
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


def _build_url_explanation(score: int, signals: list, domain: str) -> str:
    if not signals:
        return (
            f"SentinelAI's heuristic URL analyzer did not detect notable risk "
            f"indicators in the URL structure for domain '{domain}'. "
            f"This analysis is based on structural patterns only and does not "
            f"guarantee the URL is safe."
        )
    signal_names = [s.title for s in signals]
    return (
        f"SentinelAI's heuristic URL analyzer assigned a risk score of {score}/100 "
        f"to the provided URL. The following structural indicators were detected: "
        f"{', '.join(signal_names)}. This analysis examines the URL structure only "
        f"(domain, path, TLD, encoding) — it does not visit the URL. "
        f"Structural risk indicators do not guarantee the URL is malicious."
    )


def _build_url_recommendations(signals: list) -> list[str]:
    recs = []
    types = {s.type for s in signals}
    if "no_https" in types:
        recs.append("Avoid submitting personal information over unencrypted HTTP connections.")
    if "ip_based_url" in types:
        recs.append("Do not visit URLs that use raw IP addresses instead of domain names.")
    if "shortened_url" in types:
        recs.append("Use a URL expander service to preview where a shortened link leads before clicking.")
    if "lookalike_domain" in types:
        recs.append("Carefully verify the exact spelling of the domain before entering any credentials.")
    if "punycode_domain" in types:
        recs.append("Avoid domains with special character encoding — they may visually mimic legitimate sites.")
    if not recs:
        recs.append("Even when risk is low, verify URLs before entering sensitive information.")
    recs.append("When in doubt, navigate to the organization's official website directly via your browser.")
    return recs


# ---------------------------------------------------------------------------
# Email Threat Scanner
# ---------------------------------------------------------------------------

_SUSPICIOUS_SENDER_PATTERNS = [
    re.compile(r"@.*\d{4,}"),               # digits in domain
    re.compile(r"no.?reply@.*\.(tk|ml|ga|cf|gq|xyz|top|club|work|date|win|loan)"),
    re.compile(r"support@.*-support"),       # brand-support in domain
    re.compile(r"security@.*-security"),
    re.compile(r"noreply@.*\.ru$"),
    re.compile(r"service@.*service\d"),
]

_COMMON_LEGIT_TLDS = {".com", ".org", ".net", ".edu", ".gov", ".io"}

_EMAIL_KEYWORD_GROUPS = {
    "urgency": {
        "weight": 15,
        "keywords": ["urgent", "immediately", "asap", "right now", "within 24 hours",
                     "act now", "expire", "suspended", "limited time", "account will be",
                     "will be blocked", "will be suspended", "will be closed",
                     "last chance", "final notice", "24 hours", "48 hours"],
    },
    "credential_request": {
        "weight": 22,
        "keywords": ["password", "credentials", "login details", "username and password",
                     "enter your details", "provide your", "verify your identity",
                     "confirm your account", "re-enter", "reset your password"],
    },
    "otp_request": {
        "weight": 20,
        "keywords": ["otp", "one-time password", "verification code", "2fa code",
                     "two-factor", "authentication code", "share the code",
                     "don't share", "never share your otp"],
    },
    "financial_request": {
        "weight": 20,
        "keywords": ["bank account", "transfer", "wire transfer", "send money",
                     "payment required", "click to pay", "overdue invoice",
                     "billing issue", "payment failed", "update billing",
                     "credit card", "debit card", "account number", "routing number"],
    },
    "account_threat": {
        "weight": 18,
        "keywords": ["account suspended", "account blocked", "account terminated",
                     "access denied", "unauthorized access", "your account has been",
                     "detected suspicious", "security alert", "unusual activity"],
    },
    "impersonation": {
        "weight": 16,
        "keywords": ["paypal", "amazon", "microsoft", "apple", "google", "netflix",
                     "your bank", "tax authority", "irs", "government", "police",
                     "technical support", "customer service", "it department",
                     "hr department", "ceo", "management"],
    },
    "social_engineering": {
        "weight": 14,
        "keywords": ["click here", "click the link", "click below", "follow this link",
                     "don't ignore", "warning:", "action required", "important notice",
                     "you have been selected", "congratulations", "you won",
                     "claim your", "verify now"],
    },
    "kyc_scam": {
        "weight": 18,
        "keywords": ["kyc", "know your customer", "complete your kyc",
                     "kyc verification", "kyc update", "kyc pending",
                     "identity verification", "submit your documents"],
    },
}


class EmailThreatScanner:
    """Heuristic email phishing/scam detector."""

    def __init__(self):
        self._url_scanner = UrlThreatScanner()
        self._se_service = SocialEngineeringService()

    def analyze(self, sender: str, subject: str, body: str) -> ThreatScanResponse:
        combined_text = f"{subject} {body}".strip()
        if not combined_text:
            raise ValueError("Email body or subject must be provided")

        signals: List[ThreatSignalModel] = []
        score = 0

        # --- 1. Sender analysis ----------------------------------------------
        sender_signals, sender_score = self._analyze_sender(sender)
        signals.extend(sender_signals)
        score += sender_score

        # --- 2. Keyword-based content analysis -------------------------------
        text_lower = combined_text.lower()
        for group_name, cfg in _EMAIL_KEYWORD_GROUPS.items():
            matched = [kw for kw in cfg["keywords"] if kw in text_lower]
            if matched:
                severity = "critical" if cfg["weight"] >= 20 else "high" if cfg["weight"] >= 16 else "medium"
                signals.append(ThreatSignalModel(
                    type=group_name,
                    severity=severity,
                    title=group_name.replace("_", " ").title(),
                    description=f"The email contains language associated with {group_name.replace('_', ' ')}.",
                    evidence=f"Detected: {', '.join(matched[:3])}",
                ))
                score += cfg["weight"]

        # --- 3. Social engineering via existing service ----------------------
        se_result = self._se_service.analyze_transcript(combined_text)
        for ind in se_result.indicators:
            if ind.detected and not any(s.type == ind.name for s in signals):
                signals.append(ThreatSignalModel(
                    type=ind.name,
                    severity="high" if ind.confidence >= 60 else "medium",
                    title=ind.name.replace("_", " ").title(),
                    description=f"Social engineering pattern detected: {ind.name.replace('_', ' ')}.",
                    evidence=ind.evidence,
                ))
                score += 10

        # --- 4. URL extraction + analysis ------------------------------------
        urls_in_body = _extract_urls(body)
        extracted_url_results: List[ExtractedUrlResult] = []
        url_max_score = 0

        for url in urls_in_body[:5]:  # Limit to 5 URLs
            try:
                url_result = self._url_scanner.analyze(url)
                extracted_url_results.append(ExtractedUrlResult(
                    url=url,
                    risk_score=url_result.risk_score,
                    severity=url_result.severity,
                    signals=url_result.signals,
                ))
                if url_result.risk_score > url_max_score:
                    url_max_score = url_result.risk_score
            except Exception:
                pass

        # Blend URL score into overall score
        if url_max_score > 0:
            score = min(100, score + int(url_max_score * 0.4))

        # --- 5. Cross-channel correlation ------------------------------------
        correlation = CrossChannelCorrelation(detected=False)
        if extracted_url_results and url_max_score >= 30:
            high_url = next((r for r in extracted_url_results if r.risk_score >= 30), None)
            if high_url:
                correlation = CrossChannelCorrelation(
                    detected=True,
                    summary=(
                        f"A suspicious URL was found embedded in the email body. "
                        f"The URL '{high_url.url[:60]}...' scored {high_url.risk_score}/100 "
                        f"for URL risk. The combined email+URL analysis raises the overall threat level."
                    ),
                    correlated_vectors=["email_body", "embedded_url"],
                )

        # --- Score cap -------------------------------------------------------
        score = min(score, 99)
        severity = _score_to_severity(score)
        confidence = min(95, 35 + int(score * 0.55))

        explanation = _build_email_explanation(score, signals, sender)
        recommendations = _build_email_recommendations(signals)

        return ThreatScanResponse(
            success=True,
            channel="email",
            risk_score=score,
            severity=severity,
            confidence=confidence,
            signals=signals,
            extracted_urls=extracted_url_results,
            cross_channel_correlation=correlation,
            explanation=explanation,
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )

    def _analyze_sender(self, sender: str) -> tuple[List[ThreatSignalModel], int]:
        if not sender or "@" not in sender:
            return [], 0

        signals: List[ThreatSignalModel] = []
        score = 0
        sender_lower = sender.strip().lower()

        # Extract domain
        try:
            domain = sender_lower.split("@")[1]
        except IndexError:
            return signals, score

        # Digits in domain name (excluding port)
        if re.search(r"\d{3,}", domain.split(".")[0]):
            signals.append(ThreatSignalModel(
                type="suspicious_sender_domain",
                severity="medium",
                title="Suspicious Sender Domain",
                description="The sender's email domain contains an unusual number of digits.",
                evidence=sender,
            ))
            score += 15

        # Lookalike brand in domain
        for brand in _LOOKALIKE_BRANDS:
            if brand in domain:
                tld_ok = domain in (f"{brand}.com", f"www.{brand}.com")
                if not tld_ok:
                    signals.append(ThreatSignalModel(
                        type="sender_impersonation",
                        severity="critical",
                        title="Sender Brand Impersonation",
                        description=f"The sender domain appears to impersonate '{brand}'. This is a strong phishing indicator.",
                        evidence=sender,
                    ))
                    score += 30
                    break

        # Suspicious TLD
        tld_match = re.search(r"\.[a-z]{2,8}$", domain)
        if tld_match and tld_match.group(0) in _SUSPICIOUS_TLD:
            signals.append(ThreatSignalModel(
                type="suspicious_sender_tld",
                severity="medium",
                title="Suspicious Sender TLD",
                description=f"The sender uses the domain extension '{tld_match.group(0)}'.",
                evidence=sender,
            ))
            score += 12

        # Domain with multiple hyphens (common in phishing)
        subdomain = domain.split(".")[0]
        if subdomain.count("-") >= 2:
            signals.append(ThreatSignalModel(
                type="hyphenated_sender_domain",
                severity="medium",
                title="Hyphenated Sender Domain",
                description="The sender's domain contains multiple hyphens, a pattern common in phishing email addresses.",
                evidence=sender,
            ))
            score += 10

        return signals, score


def _build_email_explanation(score: int, signals: list, sender: str) -> str:
    if not signals:
        return (
            f"SentinelAI's heuristic email analyzer did not detect strong phishing "
            f"indicators in this email. This analysis is based on content patterns only."
        )
    signal_titles = list({s.title for s in signals})[:5]
    return (
        f"SentinelAI's heuristic email analyzer assigned a risk score of {score}/100 "
        f"to this email{f' from {sender}' if sender else ''}. "
        f"Detected threat indicators: {', '.join(signal_titles)}. "
        f"These patterns are commonly found in phishing and social engineering attacks. "
        f"This is a heuristic analysis — always verify through official channels."
    )


def _build_email_recommendations(signals: list) -> list[str]:
    recs = []
    types = {s.type for s in signals}
    if "credential_request" in types or "otp_request" in types:
        recs.append("Never share passwords, OTPs, or verification codes via email — legitimate organizations never ask for these.")
    if "sender_impersonation" in types or "suspicious_sender_domain" in types:
        recs.append("Contact the supposed sender organization directly using their official website or phone number.")
    if "financial_request" in types:
        recs.append("Do not make any payments or wire transfers based on email requests alone. Verify through official channels.")
    if "account_threat" in types or "urgency" in types:
        recs.append("Urgency and account-blocking threats are classic manipulation tactics — do not act hastily.")
    recs.append("Do not click any links in this email. Navigate to the official website directly via your browser.")
    recs.append("Report this email to your IT/security team or mark it as phishing in your email client.")
    return recs


# ---------------------------------------------------------------------------
# SMS Threat Scanner
# ---------------------------------------------------------------------------

_SMS_KEYWORD_GROUPS = {
    "urgency": {
        "weight": 15,
        "keywords": ["urgent", "immediately", "act now", "right now", "asap",
                     "within 24 hours", "today only", "expire", "last chance",
                     "final notice", "will be blocked", "will be suspended",
                     "will be closed", "action required"],
    },
    "account_blocking": {
        "weight": 20,
        "keywords": ["account blocked", "account suspended", "account will be blocked",
                     "blocked account", "suspended account", "freeze your account",
                     "account freeze", "card blocked", "debit blocked"],
    },
    "otp_request": {
        "weight": 25,
        "keywords": ["otp", "one-time password", "verification code", "otp code",
                     "share your otp", "provide your otp", "enter the otp",
                     "pin", "atm pin", "share your pin"],
    },
    "kyc_scam": {
        "weight": 22,
        "keywords": ["kyc", "complete kyc", "kyc verification", "kyc update",
                     "kyc pending", "kyc deadline", "submit documents"],
    },
    "banking_scam": {
        "weight": 20,
        "keywords": ["bank account", "netbanking", "internet banking", "mobile banking",
                     "transaction failed", "payment failed", "refund", "cashback",
                     "bank customer", "rbi", "reserve bank", "fdic", "unauthorized transaction"],
    },
    "delivery_scam": {
        "weight": 12,
        "keywords": ["package", "parcel", "delivery", "fedex", "ups", "dhl",
                     "shipment", "customs", "courier", "failed delivery",
                     "missed delivery", "reschedule delivery"],
    },
    "prize_lottery_scam": {
        "weight": 18,
        "keywords": ["you have won", "you are selected", "congratulations",
                     "lottery", "prize", "reward", "claim your prize",
                     "gift card", "voucher", "free iphone", "lucky winner"],
    },
    "investment_scam": {
        "weight": 18,
        "keywords": ["guaranteed return", "risk free investment", "double your money",
                     "crypto investment", "forex trading", "invest now",
                     "high return", "profit guaranteed"],
    },
    "job_scam": {
        "weight": 15,
        "keywords": ["work from home", "earn daily", "part time job",
                     "high salary", "no experience required", "registration fee",
                     "apply now", "job offer"],
    },
    "credential_request": {
        "weight": 22,
        "keywords": ["password", "credentials", "login details", "card number",
                     "cvv", "expiry date", "card details", "account details"],
    },
    "impersonation": {
        "weight": 16,
        "keywords": ["your bank", "amazon", "paypal", "microsoft", "apple",
                     "government", "tax", "irs", "police", "customer support",
                     "customer service"],
    },
}


class SmsThreatScanner:
    """Heuristic SMS/message phishing and scam detector."""

    def __init__(self):
        self._url_scanner = UrlThreatScanner()
        self._se_service = SocialEngineeringService()

    def analyze(self, message: str) -> ThreatScanResponse:
        message = message.strip()
        if not message:
            raise ValueError("SMS message must not be empty")

        signals: List[ThreatSignalModel] = []
        score = 0
        text_lower = message.lower()

        # --- 1. Keyword-based content analysis -------------------------------
        for group_name, cfg in _SMS_KEYWORD_GROUPS.items():
            matched = [kw for kw in cfg["keywords"] if kw in text_lower]
            if matched:
                severity = "critical" if cfg["weight"] >= 22 else "high" if cfg["weight"] >= 16 else "medium"
                signals.append(ThreatSignalModel(
                    type=group_name,
                    severity=severity,
                    title=group_name.replace("_", " ").title(),
                    description=f"SMS contains patterns associated with {group_name.replace('_', ' ')} scams.",
                    evidence=f"Detected: {', '.join(matched[:3])}",
                ))
                score += cfg["weight"]

        # --- 2. Social engineering service -----------------------------------
        se_result = self._se_service.analyze_transcript(message)
        for ind in se_result.indicators:
            if ind.detected and not any(s.type == ind.name for s in signals):
                signals.append(ThreatSignalModel(
                    type=ind.name,
                    severity="high" if ind.confidence >= 60 else "medium",
                    title=ind.name.replace("_", " ").title(),
                    description=f"Social engineering pattern: {ind.name.replace('_', ' ')}.",
                    evidence=ind.evidence,
                ))
                score += 8

        # --- 3. URL extraction + analysis ------------------------------------
        urls_in_sms = _extract_urls(message)
        extracted_url_results: List[ExtractedUrlResult] = []
        url_max_score = 0

        for url in urls_in_sms[:3]:
            try:
                url_result = self._url_scanner.analyze(url)
                extracted_url_results.append(ExtractedUrlResult(
                    url=url,
                    risk_score=url_result.risk_score,
                    severity=url_result.severity,
                    signals=url_result.signals,
                ))
                if url_result.risk_score > url_max_score:
                    url_max_score = url_result.risk_score
            except Exception:
                pass

        if url_max_score > 0:
            score = min(100, score + int(url_max_score * 0.4))

        # --- 4. Cross-channel correlation ------------------------------------
        correlation = CrossChannelCorrelation(detected=False)
        if extracted_url_results and url_max_score >= 25:
            high_url = next((r for r in extracted_url_results if r.risk_score >= 25), None)
            if high_url:
                correlation = CrossChannelCorrelation(
                    detected=True,
                    summary=(
                        f"A suspicious URL was found in the SMS message. "
                        f"'{high_url.url[:60]}' scored {high_url.risk_score}/100 for URL risk. "
                        f"The combination of suspicious message content and a risky URL significantly raises the threat level."
                    ),
                    correlated_vectors=["sms_body", "embedded_url"],
                )

        # --- Score cap -------------------------------------------------------
        score = min(score, 99)
        severity = _score_to_severity(score)
        confidence = min(95, 35 + int(score * 0.55))

        explanation = _build_sms_explanation(score, signals)
        recommendations = _build_sms_recommendations(signals)

        return ThreatScanResponse(
            success=True,
            channel="sms",
            risk_score=score,
            severity=severity,
            confidence=confidence,
            signals=signals,
            extracted_urls=extracted_url_results,
            cross_channel_correlation=correlation,
            explanation=explanation,
            recommendations=recommendations,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


def _build_sms_explanation(score: int, signals: list) -> str:
    if not signals:
        return (
            "SentinelAI's heuristic SMS analyzer did not detect notable scam indicators "
            "in this message. This is a heuristic analysis based on content patterns."
        )
    signal_titles = list({s.title for s in signals})[:5]
    return (
        f"SentinelAI's heuristic SMS analyzer assigned a risk score of {score}/100. "
        f"Detected threat patterns: {', '.join(signal_titles)}. "
        f"These patterns are strongly associated with SMS phishing (smishing) attacks. "
        f"This is a heuristic analysis — results should be verified."
    )


def _build_sms_recommendations(signals: list) -> list[str]:
    recs = []
    types = {s.type for s in signals}
    if "otp_request" in types or "credential_request" in types:
        recs.append("Never share OTPs, PINs, passwords, or card details via SMS or phone — no legitimate organization will ask for these.")
    if "banking_scam" in types or "kyc_scam" in types:
        recs.append("Contact your bank directly using the official number on their website or the back of your card.")
    if "account_blocking" in types or "urgency" in types:
        recs.append("Threats about account blocking are a manipulation tactic. Do not respond to pressure — verify independently.")
    if "prize_lottery_scam" in types or "investment_scam" in types:
        recs.append("Unsolicited prize or investment offers via SMS are almost always scams. Ignore and block the sender.")
    if "delivery_scam" in types:
        recs.append("Verify delivery notifications by going to the courier's official website — do not click SMS links.")
    recs.append("Do not click any links in this SMS. Block and report the sender number.")
    return recs
