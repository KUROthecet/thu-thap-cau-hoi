from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    doc_id: int
    title: str
    publisher: str | None
    version_label: str | None
    created_at: datetime


class ChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chunk_id: int
    doc_id: int
    doc_title: str
    location_label: str
    content: str


class ImportResult(BaseModel):
    documents_created: int
    chunks_created: int
