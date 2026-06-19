"""
Email OTP Authentication Service
Sends OTP codes via Gmail for email-based login

Author: Kisan.JI Team
"""

import smtplib
import random
import logging
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Optional
from datetime import datetime, timezone

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Gmail credentials for sending OTP (reads from env, falls back to hardcoded)
import os
from dotenv import load_dotenv
from pathlib import Path as _Path
load_dotenv(_Path(__file__).parent / '.env')

GMAIL_USER = os.environ.get("GMAIL_USER", "ankunegi482@gmail.com")
GMAIL_APP_PASSWORD = os.environ.get("GMAIL_APP_PASSWORD", "rljz twhy adhk wfrf")

# OTP storage: { email: { otp: str, timestamp: float, attempts: int } }
otp_store: Dict[str, dict] = {}

# OTP Configuration
OTP_LENGTH = 6
OTP_EXPIRY_SECONDS = 300  # 5 minutes
MAX_ATTEMPTS = 5
RATE_LIMIT_SECONDS = 60  # 1 minute between OTP requests


class EmailOTPService:
    """Service for email-based OTP authentication"""

    def __init__(self):
        self.gmail_user = GMAIL_USER
        self.gmail_password = GMAIL_APP_PASSWORD

    def _generate_otp(self) -> str:
        """Generate a 6-digit OTP"""
        return str(random.randint(100000, 999999))

    def _is_rate_limited(self, email: str) -> bool:
        """Check if email is rate-limited"""
        if email in otp_store:
            elapsed = time.time() - otp_store[email].get("timestamp", 0)
            if elapsed < RATE_LIMIT_SECONDS:
                return True
        return False

    def _is_otp_expired(self, email: str) -> bool:
        """Check if OTP has expired"""
        if email not in otp_store:
            return True
        elapsed = time.time() - otp_store[email].get("timestamp", 0)
        return elapsed > OTP_EXPIRY_SECONDS

    def send_otp(self, email: str) -> dict:
        """
        Generate and send OTP to the given email address

        Args:
            email: Recipient email address

        Returns:
            dict with success status and message
        """
        # Validate email format
        if not email or "@" not in email or "." not in email:
            return {
                "success": False,
                "message": "Invalid email address"
            }

        # Check rate limiting
        if self._is_rate_limited(email):
            remaining = int(RATE_LIMIT_SECONDS - (time.time() - otp_store[email]["timestamp"]))
            return {
                "success": False,
                "message": f"Please wait {remaining} seconds before requesting a new OTP"
            }

        # Generate OTP
        otp = self._generate_otp()

        # Store OTP
        otp_store[email] = {
            "otp": otp,
            "timestamp": time.time(),
            "attempts": 0
        }

        # Send email
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = "🌾 Kisan.JI - Your Login OTP Code"
            msg["From"] = self.gmail_user
            msg["To"] = email

            # Plain text version
            text_body = f"""
Your Kisan.JI Login OTP Code

Your one-time password is: {otp}

This code will expire in 5 minutes.
Do not share this code with anyone.

- Team Kisan.JI
"""

            # HTML version (prettier email)
            html_body = f"""
<!DOCTYPE html>
<html>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #0a0a0a; color: #e5e5e5; margin: 0; padding: 20px;">
  <div style="max-width: 480px; margin: 0 auto; background: linear-gradient(135deg, #064e3b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);">
    <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; color: white;">🌾 Kisan.JI</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Smart Agriculture Platform</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; color: #d1d5db; margin-top: 0;">Your login verification code:</p>
      <div style="background: rgba(255,255,255,0.05); border: 2px dashed #10b981; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981; font-family: 'Courier New', monospace;">{otp}</span>
      </div>
      <p style="font-size: 13px; color: #9ca3af;">⏱ This code expires in <strong>5 minutes</strong></p>
      <p style="font-size: 13px; color: #9ca3af;">🔒 Do not share this code with anyone</p>
    </div>
    <div style="padding: 16px 32px; background: rgba(0,0,0,0.2); text-align: center;">
      <p style="font-size: 11px; color: #6b7280; margin: 0;">Team Kisan.JI - Empowering Indian Farmers</p>
    </div>
  </div>
</body>
</html>
"""

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            # Send via Gmail SMTP
            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(self.gmail_user, self.gmail_password)
                server.sendmail(self.gmail_user, email, msg.as_string())

            logger.info(f"✅ OTP sent to {email[:3]}***{email[email.index('@'):]}")
            return {
                "success": True,
                "message": "OTP sent successfully. Check your email.",
                "expires_in": OTP_EXPIRY_SECONDS
            }

        except smtplib.SMTPAuthenticationError:
            logger.error("❌ Gmail authentication failed. Check app password.")
            # Remove stored OTP on failure
            otp_store.pop(email, None)
            return {
                "success": False,
                "message": "Email service authentication error. Please try again later."
            }
        except Exception as e:
            logger.error(f"❌ Failed to send OTP: {e}")
            otp_store.pop(email, None)
            return {
                "success": False,
                "message": "Failed to send OTP. Please try again."
            }

    def verify_otp(self, email: str, otp: str) -> dict:
        """
        Verify the OTP for a given email

        Args:
            email: Email address
            otp: OTP code to verify

        Returns:
            dict with success status and message
        """
        # Check if OTP exists
        if email not in otp_store:
            return {
                "success": False,
                "message": "No OTP found. Please request a new one."
            }

        stored = otp_store[email]

        # Check expiry
        if self._is_otp_expired(email):
            otp_store.pop(email, None)
            return {
                "success": False,
                "message": "OTP has expired. Please request a new one."
            }

        # Check max attempts
        if stored["attempts"] >= MAX_ATTEMPTS:
            otp_store.pop(email, None)
            return {
                "success": False,
                "message": "Too many failed attempts. Please request a new OTP."
            }

        # Increment attempt counter
        stored["attempts"] += 1

        # Verify OTP
        if str(stored["otp"]) == str(otp).strip():
            # OTP matched - remove from store
            otp_store.pop(email, None)
            logger.info(f"✅ OTP verified for {email[:3]}***{email[email.index('@'):]}")
            return {
                "success": True,
                "message": "OTP verified successfully. Login successful!"
            }
        else:
            remaining = MAX_ATTEMPTS - stored["attempts"]
            return {
                "success": False,
                "message": f"Invalid OTP. {remaining} attempts remaining."
            }


# Singleton instance
_otp_service = None


def get_otp_service() -> EmailOTPService:
    """Get or create OTP service singleton"""
    global _otp_service
    if _otp_service is None:
        _otp_service = EmailOTPService()
    return _otp_service


if __name__ == "__main__":
    # Test
    service = EmailOTPService()
    print("OTP Service ready")
    # result = service.send_otp("test@example.com")
    # print(result)
