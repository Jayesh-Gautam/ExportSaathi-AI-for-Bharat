"""API routes for finance readiness analysis."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.finance_service import analyze_finance

router = APIRouter(prefix="/api/finance", tags=["finance"])


class FinanceRequest(BaseModel):
    product_name: str
    hs_code: str = ""
    destination_country: str = ""
    business_type: str = "Manufacturing"
    company_size: str = "Micro"
    certification_cost: int = 100000
    documentation_cost: int = 25000
    logistics_cost: int = 150000


@router.get("/analysis/{report_id}")
async def get_finance_analysis(report_id: str):
    """Get finance analysis for a report (uses default data if report not found)."""
    try:
        result = analyze_finance({"report_id": report_id, "product_name": "Export Product"})
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis")
async def create_finance_analysis(req: FinanceRequest):
    """Generate finance analysis from provided data."""
    try:
        result = analyze_finance(req.model_dump())
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
