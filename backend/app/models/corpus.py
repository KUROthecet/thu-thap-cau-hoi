from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Identity, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class GuidelineDocument(Base):
    __tablename__ = "guideline_documents"

    doc_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False, unique=True)
    publisher: Mapped[str | None] = mapped_column(String(255), nullable=True)
    version_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    source_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    chunks: Mapped[list["GuidelineChunk"]] = relationship(
        "GuidelineChunk", back_populates="document"
    )


class GuidelineChunk(Base):
    __tablename__ = "guideline_chunks"

    chunk_id: Mapped[int] = mapped_column(BigInteger, Identity(), primary_key=True)
    doc_id: Mapped[int] = mapped_column(
        BigInteger, ForeignKey("guideline_documents.doc_id", ondelete="CASCADE"), nullable=False
    )
    external_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    location_label: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    document: Mapped[GuidelineDocument] = relationship(
        "GuidelineDocument", back_populates="chunks", lazy="selectin"
    )

    @property
    def doc_title(self) -> str:
        return self.document.title
