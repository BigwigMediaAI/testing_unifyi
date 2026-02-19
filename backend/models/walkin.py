from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
from enum import Enum
import uuid


class WalkInStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    MODIFIED = "modified"
    REJECTED = "rejected"
    COMPLETED = "completed"


class WalkIn(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

    university_id: str
    lead_id: str
    student_id: str

    counsellor_id: Optional[str] = None

    # request details
    visit_date: datetime
    visit_time: str
    number_of_persons: int = Field(gt=0)
    reason: Optional[str] = None

    status: WalkInStatus = WalkInStatus.REQUESTED
    counsellor_note: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WalkInCreate(BaseModel):
    visit_date: datetime
    visit_time: str
    number_of_persons: int = Field(gt=0)
    reason: Optional[str] = None
