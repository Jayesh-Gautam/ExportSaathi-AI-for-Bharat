"""API routes for report generation."""

import logging
from fastapi import APIRouter, HTTPException

from models.schemas import QueryInput, ExportReadinessReport, ErrorResponse
from services.report_generator import generate_report, get_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.post("/generate", response_model=ExportReadinessReport)
async def generate_export_report(query: QueryInput):
    """Generate a comprehensive Export Readiness Report."""
    try:
        report = generate_report(query)
        return report
    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Report generation failed",
                "detail": str(e),
                "code": "GENERATION_FAILED",
            },
        )


@router.get("/{report_id}", response_model=ExportReadinessReport)
async def get_existing_report(report_id: str):
    """Retrieve a previously generated report."""
    report = get_report(report_id)
    if not report:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Report not found",
                "detail": f"No report found with ID: {report_id}",
                "code": "NOT_FOUND",
            },
        )
    return report
