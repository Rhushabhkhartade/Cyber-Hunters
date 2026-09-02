import unittest
from starlette.testclient import TestClient

from app.main import app
from app.services.threat_scanner_service import (
    EmailThreatScanner,
    UrlThreatScanner,
    SmsThreatScanner,
)
from app.api.v1.auth import create_access_token


class ThreatScannerServiceTests(unittest.TestCase):
    def setUp(self):
        self.url_scanner = UrlThreatScanner()
        self.email_scanner = EmailThreatScanner()
        self.sms_scanner = SmsThreatScanner()

    def test_safe_url(self):
        result = self.url_scanner.analyze("https://example.com/about")
        self.assertTrue(result.success)
        self.assertEqual(result.channel, "url")
        self.assertEqual(result.severity, "SAFE")
        self.assertEqual(result.risk_score, 0)
        self.assertEqual(len(result.signals), 0)

    def test_suspicious_url_ip_and_no_https(self):
        result = self.url_scanner.analyze("http://192.168.1.1/login/verify")
        self.assertTrue(result.success)
        self.assertIn(result.severity, ["MEDIUM", "HIGH", "CRITICAL"])
        self.assertGreater(result.risk_score, 30)
        signal_types = [s.type for s in result.signals]
        self.assertIn("no_https", signal_types)
        self.assertIn("ip_based_url", signal_types)
        self.assertIn("suspicious_path", signal_types)

    def test_suspicious_url_brand_lookalike(self):
        result = self.url_scanner.analyze("https://paypa1-security-update.xyz/login")
        self.assertTrue(result.success)
        self.assertIn(result.severity, ["HIGH", "CRITICAL"])
        signal_types = [s.type for s in result.signals]
        self.assertIn("lookalike_domain", signal_types)
        self.assertIn("suspicious_tld", signal_types)

    def test_safe_email(self):
        result = self.email_scanner.analyze(
            sender="newsletter@reliable-service.com",
            subject="Weekly Engineering Updates",
            body="Here are the engineering team updates for this week. Great progress on the new release.",
        )
        self.assertTrue(result.success)
        self.assertEqual(result.channel, "email")
        self.assertIn(result.severity, ["SAFE", "LOW"])

    def test_malicious_phishing_email_with_cross_channel(self):
        result = self.email_scanner.analyze(
            sender="security@paypa1-support-alert.xyz",
            subject="URGENT: Your account will be suspended within 24 hours",
            body="Dear user, your PayPal account is locked. Verify your identity immediately and provide OTP at: http://192.168.1.1/paypal/verify",
        )
        self.assertTrue(result.success)
        self.assertIn(result.severity, ["HIGH", "CRITICAL"])
        self.assertGreater(result.risk_score, 50)
        self.assertTrue(len(result.extracted_urls) > 0)
        self.assertIsNotNone(result.cross_channel_correlation)
        self.assertTrue(result.cross_channel_correlation.detected)

    def test_safe_sms(self):
        result = self.sms_scanner.analyze("Hey, are we still meeting for lunch at 1pm tomorrow?")
        self.assertTrue(result.success)
        self.assertEqual(result.channel, "sms")
        self.assertEqual(result.severity, "SAFE")

    def test_malicious_smishing_sms_with_cross_channel(self):
        result = self.sms_scanner.analyze(
            "URGENT: Your bank account will be blocked today. Complete KYC immediately and share your OTP: http://bank-verify-kyc.xyz/login"
        )
        self.assertTrue(result.success)
        self.assertIn(result.severity, ["HIGH", "CRITICAL"])
        self.assertGreater(result.risk_score, 50)
        self.assertTrue(len(result.extracted_urls) > 0)
        self.assertIsNotNone(result.cross_channel_correlation)
        self.assertTrue(result.cross_channel_correlation.detected)


class ThreatScannerApiEndpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.token = create_access_token(subject="demo")
        cls.auth_headers = {"Authorization": f"Bearer {cls.token}"}

    def test_unauthenticated_url_returns_401(self):
        response = self.client.post("/api/v1/threat/url", json={"url": "https://example.com"})
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_email_returns_401(self):
        response = self.client.post("/api/v1/threat/email", json={"body": "Hello"})
        self.assertEqual(response.status_code, 401)

    def test_unauthenticated_sms_returns_401(self):
        response = self.client.post("/api/v1/threat/sms", json={"message": "Hello"})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_url_scan_success(self):
        response = self.client.post(
            "/api/v1/threat/url",
            json={"url": "https://example.com/fake-page"},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["channel"], "url")
        self.assertIn("risk_score", data)
        self.assertIn("severity", data)
        self.assertIn("signals", data)
        self.assertIn("explanation", data)
        self.assertIn("recommendations", data)

    def test_authenticated_email_scan_success(self):
        response = self.client.post(
            "/api/v1/threat/email",
            json={
                "sender": "security@paypa1-support.com",
                "subject": "URGENT: Suspended account",
                "body": "Your PayPal account is locked. Provide OTP to verify.",
            },
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["channel"], "email")
        self.assertIn(data["severity"], ["HIGH", "CRITICAL"])

    def test_authenticated_sms_scan_success(self):
        response = self.client.post(
            "/api/v1/threat/sms",
            json={
                "message": "URGENT! Bank account blocked. Complete KYC: http://bank-kyc.xyz",
            },
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertEqual(data["channel"], "sms")
        self.assertIn(data["severity"], ["HIGH", "CRITICAL"])

    def test_invalid_url_empty_returns_400(self):
        response = self.client.post(
            "/api/v1/threat/url",
            json={"url": ""},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_url_malformed_returns_400(self):
        response = self.client.post(
            "/api/v1/threat/url",
            json={"url": "not-a-valid-url-scheme"},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_email_empty_body_returns_400(self):
        response = self.client.post(
            "/api/v1/threat/email",
            json={"sender": "test@test.com", "subject": "hi", "body": "   "},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 400)

    def test_invalid_sms_empty_returns_400(self):
        response = self.client.post(
            "/api/v1/threat/sms",
            json={"message": "   "},
            headers=self.auth_headers,
        )
        self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
