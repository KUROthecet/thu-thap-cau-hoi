from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.corpus import GuidelineChunk


class CorpusService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

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
