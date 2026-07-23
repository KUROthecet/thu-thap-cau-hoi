from fastapi import APIRouter, UploadFile

from app.api.deps import ActiveUser, AdminUser, CorpusServiceDep
from app.core.exceptions import BadRequestError
from app.schemas.corpus import ChunkOut, DocumentOut, ImportResult
from app.services.corpus_service import CorpusService

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


@router.get(
    "/admin/corpus/documents",
    response_model=list[DocumentOut],
    summary="List imported guideline documents (Admin)",
)
async def list_documents(corpus_service: CorpusServiceDep, _: AdminUser) -> list[DocumentOut]:
    documents = await corpus_service.list_documents()
    return [DocumentOut.model_validate(document) for document in documents]


@router.post(
    "/admin/corpus/import",
    response_model=ImportResult,
    summary="Import a guideline chunk corpus (JSON or CSV) (Admin)",
)
async def import_corpus(
    corpus_service: CorpusServiceDep, _: AdminUser, file: UploadFile
) -> ImportResult:
    raw = await file.read()
    filename = (file.filename or "").lower()
    if filename.endswith(".json"):
        rows = CorpusService.parse_json(raw)
    elif filename.endswith(".csv"):
        rows = CorpusService.parse_csv(raw)
    else:
        raise BadRequestError("Chỉ hỗ trợ file .json hoặc .csv.")

    documents_created, chunks_created = await corpus_service.import_rows(rows)
    return ImportResult(documents_created=documents_created, chunks_created=chunks_created)
