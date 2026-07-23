import csv
import io
import json
from collections.abc import Iterator
from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError
from app.models.corpus import GuidelineChunk, GuidelineDocument
from app.services.html_text import strip_html_tags

PIPELINE_CHILD_KEYS = ("chapters", "sections", "subsections")
MIN_PIPELINE_NODE_CONTENT_LENGTH = 20


class CorpusImportRow:
    __slots__ = ("doc_title", "publisher", "version_label", "location_label", "content", "external_ref")

    def __init__(
        self,
        doc_title: str,
        location_label: str,
        content: str,
        publisher: str | None = None,
        version_label: str | None = None,
        external_ref: str | None = None,
    ) -> None:
        self.doc_title = doc_title
        self.publisher = publisher
        self.version_label = version_label
        self.location_label = location_label
        self.content = content
        self.external_ref = external_ref


class CorpusService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_documents(self) -> list[GuidelineDocument]:
        stmt = select(GuidelineDocument).order_by(GuidelineDocument.title)
        return list((await self.db.execute(stmt)).scalars().all())

    async def search_chunks(
        self, *, query: str | None, doc_id: int | None, limit: int = 30
    ) -> list[GuidelineChunk]:
        stmt = select(GuidelineChunk)
        if doc_id is not None:
            stmt = stmt.where(GuidelineChunk.doc_id == doc_id)
        if query:
            like = f"%{query.strip()}%"
            stmt = stmt.where(
                or_(GuidelineChunk.content.ilike(like), GuidelineChunk.location_label.ilike(like))
            )
        stmt = stmt.order_by(GuidelineChunk.doc_id, GuidelineChunk.chunk_id).limit(limit)
        return list((await self.db.execute(stmt)).scalars().all())

    async def import_rows(self, rows: list[CorpusImportRow]) -> tuple[int, int]:
        if not rows:
            raise BadRequestError("File import không có dữ liệu hợp lệ.")

        documents_by_title: dict[str, GuidelineDocument] = {}
        existing_stmt = select(GuidelineDocument)
        for document in (await self.db.execute(existing_stmt)).scalars().all():
            documents_by_title[document.title] = document

        created_docs = 0
        created_chunks = 0
        for row in rows:
            document = documents_by_title.get(row.doc_title)
            if document is None:
                document = GuidelineDocument(
                    title=row.doc_title,
                    publisher=row.publisher,
                    version_label=row.version_label,
                )
                self.db.add(document)
                await self.db.flush()
                documents_by_title[row.doc_title] = document
                created_docs += 1

            self.db.add(
                GuidelineChunk(
                    doc_id=document.doc_id,
                    external_ref=row.external_ref,
                    location_label=row.location_label,
                    content=row.content,
                )
            )
            created_chunks += 1

        await self.db.flush()
        return created_docs, created_chunks

    @staticmethod
    def parse_json(raw: bytes) -> list[CorpusImportRow]:
        try:
            data = json.loads(raw.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError) as exc:
            raise BadRequestError("File JSON không hợp lệ.") from exc

        if isinstance(data, list):
            return CorpusService._parse_flat_rows(data)
        if isinstance(data, dict) and any(key in data for key in PIPELINE_CHILD_KEYS):
            return list(CorpusService._parse_pipeline_document(data))
        raise BadRequestError(
            "File JSON phải là mảng các chunk, hoặc một tài liệu có cấu trúc chapters/sections."
        )

    @staticmethod
    def _parse_flat_rows(items: list[Any]) -> list[CorpusImportRow]:
        rows: list[CorpusImportRow] = []
        for item in items:
            doc_title = str(item.get("doc_title") or "").strip()
            location_label = str(item.get("location_label") or "").strip()
            content = str(item.get("content") or "").strip()
            if not doc_title or not location_label or not content:
                continue
            rows.append(
                CorpusImportRow(
                    doc_title=doc_title,
                    location_label=location_label,
                    content=content,
                    publisher=(item.get("publisher") or None),
                    version_label=(item.get("version_label") or None),
                    external_ref=(item.get("external_ref") or None),
                )
            )
        return rows

    @staticmethod
    def _parse_pipeline_document(data: dict[str, Any]) -> Iterator[CorpusImportRow]:
        doc_title = str(data.get("title") or "").strip()
        if not doc_title:
            raise BadRequestError("Tài liệu JSON thiếu trường 'title'.")
        publisher = data.get("publisher") or None
        version_label = str(data.get("date") or data.get("decision_number") or "").strip() or None

        for child_key in PIPELINE_CHILD_KEYS:
            for node in data.get(child_key) or []:
                yield from CorpusService._walk_pipeline_node(
                    node, doc_title=doc_title, publisher=publisher, version_label=version_label
                )

    @staticmethod
    def _walk_pipeline_node(
        node: dict[str, Any], *, doc_title: str, publisher: str | None, version_label: str | None
    ) -> Iterator[CorpusImportRow]:
        title = str(node.get("title") or "").strip()
        raw_content = str(node.get("content") or "")
        content = strip_html_tags(raw_content)
        if title and len(content) >= MIN_PIPELINE_NODE_CONTENT_LENGTH:
            yield CorpusImportRow(
                doc_title=doc_title,
                location_label=title,
                content=content,
                publisher=publisher,
                version_label=version_label,
                external_ref=str(node.get("node_id") or "") or None,
            )
        for child_key in PIPELINE_CHILD_KEYS:
            for child in node.get(child_key) or []:
                yield from CorpusService._walk_pipeline_node(
                    child, doc_title=doc_title, publisher=publisher, version_label=version_label
                )

    @staticmethod
    def parse_csv(raw: bytes) -> list[CorpusImportRow]:
        try:
            text = raw.decode("utf-8-sig")
        except UnicodeDecodeError as exc:
            raise BadRequestError("File CSV không đúng định dạng UTF-8.") from exc

        reader = csv.DictReader(io.StringIO(text))
        required = {"doc_title", "location_label", "content"}
        if reader.fieldnames is None or not required.issubset(set(reader.fieldnames)):
            raise BadRequestError(
                "File CSV cần có tối thiểu các cột: doc_title, location_label, content."
            )

        rows: list[CorpusImportRow] = []
        for record in reader:
            doc_title = (record.get("doc_title") or "").strip()
            location_label = (record.get("location_label") or "").strip()
            content = (record.get("content") or "").strip()
            if not doc_title or not location_label or not content:
                continue
            rows.append(
                CorpusImportRow(
                    doc_title=doc_title,
                    location_label=location_label,
                    content=content,
                    publisher=(record.get("publisher") or None),
                    version_label=(record.get("version_label") or None),
                    external_ref=(record.get("external_ref") or None),
                )
            )
        return rows
