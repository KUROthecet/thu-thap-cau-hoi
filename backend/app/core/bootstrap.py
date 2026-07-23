import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.services.auth_service import AuthService
from app.services.taxonomy_service import TaxonomyService

logger = logging.getLogger(__name__)


async def bootstrap_application_data(session: AsyncSession) -> None:
    auth_service = AuthService(session)
    admin = await auth_service.ensure_default_admin(
        email=settings.DEFAULT_ADMIN_EMAIL,
        password=settings.DEFAULT_ADMIN_PASSWORD,
        full_name=settings.DEFAULT_ADMIN_FULL_NAME,
    )
    logger.info("Bootstrap: admin ready (%s)", admin.email)

    if settings.SEED_TAXONOMY:
        taxonomy_service = TaxonomyService(session)
        await taxonomy_service.seed_defaults()
        logger.info("Bootstrap: taxonomy seed checked.")

    await session.commit()
