import os
import hmac
import hashlib
from typing import Any, Dict, Optional
import httpx


class WhatsAppService:
    """Service layer for WhatsApp Cloud API integration."""

    def __init__(self) -> None:
        self.api_version = os.environ.get("WHATSAPP_API_VERSION", "v20.0")
        self.phone_number_id = os.environ.get("WHATSAPP_PHONE_NUMBER_ID", "")
        self.access_token = os.environ.get("WHATSAPP_ACCESS_TOKEN", "")
        self.verify_token = os.environ.get("WHATSAPP_VERIFY_TOKEN", "")
        self.app_secret = os.environ.get("WHATSAPP_APP_SECRET", "")

    @property
    def is_configured(self) -> bool:
        return bool(self.phone_number_id and self.access_token)

    async def send_text_message(
        self,
        to: str,
        message: str,
        reply_to_message_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured:
            raise ValueError("WhatsApp is not configured. Missing phone number id or access token.")

        url = f"https://graph.facebook.com/{self.api_version}/{self.phone_number_id}/messages"
        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json",
        }

        payload: Dict[str, Any] = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": to,
            "type": "text",
            "text": {"preview_url": False, "body": message},
        }

        if reply_to_message_id:
            payload["context"] = {"message_id": reply_to_message_id}

        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(url, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    def verify_webhook_signature(self, request_body: bytes, signature_header: str) -> bool:
        """Verify Meta webhook signature using app secret."""
        if not self.app_secret:
            return True
        if not signature_header or not signature_header.startswith("sha256="):
            return False

        expected = hmac.new(
            self.app_secret.encode("utf-8"),
            request_body,
            hashlib.sha256,
        ).hexdigest()
        received = signature_header.split("=", 1)[1]
        return hmac.compare_digest(expected, received)


whatsapp_service = WhatsAppService()
