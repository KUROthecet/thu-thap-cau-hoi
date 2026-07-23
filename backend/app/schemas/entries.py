import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ChunkSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chunk_id: int
    doc_id: int
    doc_title: str
    location_label: str
    content: str


class CitationIn(BaseModel):
    kind: str
    chunk_id: int | None = None
    manual_doc_name: str | None = None
    manual_location: str | None = None
    points: list[str] = Field(default_factory=list)


class CitationPointOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    point_id: int
    content: str


class CitationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    citation_id: int
    kind: str
    chunk_id: int | None
    chunk: ChunkSummary | None
    manual_doc_name: str | None
    manual_location: str | None
    points: list[CitationPointOut]


class QaEntryUpsertRequest(BaseModel):
    subgroup_id: int
    role: str
    disease_or_topic: str
    query: str = Field(min_length=1)
    expected_behavior: str
    expert_gold_answer: str = Field(min_length=1)
    required_key_points: list[str] = Field(default_factory=list)
    safety_notes: str | None = None
    annotator_name: str
    review_status: str = "draft"
    note_for_expert: str | None = None
    citations: list[CitationIn] = Field(default_factory=list)


class QaEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    entry_id: uuid.UUID
    doctor_id: int
    subgroup_id: int
    slot_index: int
    is_extra: bool
    role: str
    disease_or_topic: str
    query: str
    expected_behavior: str
    expert_gold_answer: str
    required_key_points: list[str]
    safety_notes: str | None
    annotator_name: str
    review_status: str
    note_for_expert: str | None
    created_at: datetime
    updated_at: datetime
    citations: list[CitationOut]


class QaEntryCreateResult(BaseModel):
    entry: QaEntryResponse
    duplicate_warning: bool
