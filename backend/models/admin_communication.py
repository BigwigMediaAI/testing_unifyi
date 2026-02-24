from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


# ==============================
# ENUMS
# ==============================

class CommunicationType(str, Enum):
    EMAIL = "email"
    # Future ready
    # SMS = "sms"
    # NOTIFICATION = "notification"


class CommunicationStatus(str, Enum):
    SENT = "sent"
    PARTIAL = "partial"
    FAILED = "failed"


# ==============================
# DATABASE MODEL
# ==============================

class AdminCommunication(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    # Communication type
    type: CommunicationType = CommunicationType.EMAIL

    # Content
    subject: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)  # HTML or plain text

    # Sender (Super Admin ID)
    sent_by: str

    # Recipients
    recipient_university_ids: List[str]
    send_to_all: bool = False

    total_recipients: int = Field(ge=0)

    # Delivery results
    successful: int = Field(default=0, ge=0)
    failed: int = Field(default=0, ge=0)

    status: CommunicationStatus = CommunicationStatus.SENT

    # Timestamps
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )


# ==============================
# REQUEST SCHEMA (API)
# ==============================

class AdminCommunicationCreate(BaseModel):
    university_ids: Optional[List[str]] = None
    send_to_all: bool = False

    subject: str = Field(..., min_length=1)
    message: str = Field(..., min_length=1)


# ==============================
# RESPONSE SCHEMA (OPTIONAL)
# ==============================

class AdminCommunicationHistoryResponse(BaseModel):
    id: str
    type: CommunicationType
    subject: str
    message: str

    sent_by: str
    recipient_university_ids: List[str]
    send_to_all: bool

    total_recipients: int
    successful: int
    failed: int
    status: CommunicationStatus

    university_names: List[str] = Field(default_factory=list)

    created_at: datetime
    updated_at: datetime
    id: str
    type: CommunicationType
    subject: str
    sent_by: str
    message: str 

    recipient_university_ids: List[str]
    send_to_all: bool

    total_recipients: int
    successful: int
    failed: int
    status: CommunicationStatus

    university_names: Optional[List[str]] = []   # ✅ ADD THIS

    created_at: datetime
    updated_at: datetime