"""API routes for logistics risk analysis."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.logistics_service import analyze_logistics

router = APIRouter(prefix="/api/logistics", tags=["logistics"])


class LogisticsRequest(BaseModel):
    product_name: str
    destination_country: str
    hs_code: str = ""
    monthly_volume: int = 100
    business_type: str = "Manufacturing"


@router.post("/risk-analysis")
async def get_logistics_risk(req: LogisticsRequest):
    """Analyze logistics risks for an export."""
    try:
        result = analyze_logistics(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
