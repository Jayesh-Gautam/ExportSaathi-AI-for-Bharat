"""API routes for document generation and validation."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from services.document_generator import get_document_types, generate_document, validate_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


class GenerateDocRequest(BaseModel):
    doc_type: str
    report_data: dict


class ValidateDocRequest(BaseModel):
    doc_type: str
    fields: list[dict]


@router.get("/types")
async def list_document_types():
    """List available document types."""
    return {"types": get_document_types()}


@router.post("/generate")
async def generate_doc(req: GenerateDocRequest):
    """Generate an export document."""
    try:
        result = generate_document(req.doc_type, req.report_data)
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate")
async def validate_doc(req: ValidateDocRequest):
    """Validate an export document for compliance."""
    try:
        return validate_document(req.doc_type, req.fields)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
