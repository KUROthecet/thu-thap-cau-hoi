from pydantic import BaseModel, ConfigDict


class ChunkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    chunk_id: int
    doc_id: int
    doc_title: str
    location_label: str
    content: str
