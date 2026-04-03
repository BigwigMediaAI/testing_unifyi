from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class WhatsAppMessageType(str, Enum):
    INCOMING = "incoming"
    OUTGOING = "outgoing"


class WhatsAppUser(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str = "Unknown"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhatsAppMessage(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user: str
    from_number: str
    text: str
    type: WhatsAppMessageType
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WhatsAppSendRequest(BaseModel):
    to: str
    message: str
