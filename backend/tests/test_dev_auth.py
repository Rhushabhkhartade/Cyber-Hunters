import asyncio
import unittest
from unittest.mock import patch

from app.services.auth_service import authenticate_user


class DevAuthTests(unittest.TestCase):
    def test_dev_mode_accepts_demo_credentials_without_db(self):
        with patch("app.services.auth_service.settings.dev_auth_enabled", True), patch(
            "app.services.auth_service.settings.dev_auth_username", "demo"
        ), patch("app.services.auth_service.settings.dev_auth_password", "demo123"), patch(
            "app.services.auth_service.MongoDB.get_db", side_effect=RuntimeError("db unavailable")
        ):
            user = asyncio.run(authenticate_user("demo", "demo123"))

        self.assertIsNotNone(user)
        self.assertEqual(user["username"], "demo")


if __name__ == "__main__":
    unittest.main()
