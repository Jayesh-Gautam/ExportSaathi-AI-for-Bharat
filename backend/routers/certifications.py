"""API routes for certification guidance."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.certification_solver import generate_guidance

router = APIRouter(prefix="/api/certifications", tags=["certifications"])


class GuidanceRequest(BaseModel):
    cert_name: str
    cert_type: str = "other"
    product_type: str
    destination_country: str
    company_size: str = "Micro"


@router.post("/{cert_id}/guidance")
async def get_certification_guidance(cert_id: str, req: GuidanceRequest):
    """Generate detailed certification guidance."""
    try:
        guidance = generate_guidance(
            cert_id=cert_id,
            cert_name=req.cert_name,
            cert_type=req.cert_type,
            product_type=req.product_type,
            destination_country=req.destination_country,
            company_size=req.company_size,
        )
        return guidance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
