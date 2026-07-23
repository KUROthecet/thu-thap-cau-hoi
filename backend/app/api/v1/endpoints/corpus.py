from fastapi import APIRouter

from app.api.deps import ActiveUser, CorpusServiceDep
from app.schemas.corpus import ChunkOut

router = APIRouter(tags=["Corpus"])


@router.get("/corpus/chunks", response_model=list[ChunkOut], summary="Search guideline chunks")
async def search_chunks(
    corpus_service: CorpusServiceDep,
    _: ActiveUser,
    q: str | None = None,
    doc_id: int | None = None,
) -> list[ChunkOut]:
    chunks = await corpus_service.search_chunks(query=q, doc_id=doc_id)
    return [ChunkOut.model_validate(chunk) for chunk in chunks]
