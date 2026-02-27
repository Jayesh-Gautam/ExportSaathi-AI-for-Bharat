"""Certification Solver service — generates deep-dive guidance for each certification."""

import json
import uuid
import logging
from datetime import datetime

from services.llm_client import llm_client

logger = logging.getLogger(__name__)

# In-memory cache for generated guidance
_guidance_cache: dict[str, dict] = {}

SYSTEM_PROMPT = """You are ExportSaathi's Certification Navigator — a specialist in export certifications for Indian MSMEs.
You provide detailed, actionable guidance for obtaining specific certifications needed for export compliance.
Always reference Indian regulations, government portals, and real certification bodies."""

GUIDANCE_PROMPT = """Generate comprehensive certification guidance for the following:

**Certification:** {cert_name} ({cert_type})
**Product Type:** {product_type}
**Destination Country:** {destination_country}
**Company Size:** {company_size}

Respond with a JSON object with this EXACT structure:
{{
  "overview": "Brief summary of what this certification is and why it's required for this product-market combination",
  "why_required": "Detailed explanation of legal/regulatory requirement",
  "steps": [
    {{
      "step_number": 1,
      "title": "Step title",
      "description": "Detailed instructions",
      "estimated_days": 5,
      "documents_needed": ["Document 1", "Document 2"],
      "tips": "Insider tips to speed up this step"
    }}
  ],
  "document_checklist": [
    {{
      "id": "doc_1",
      "name": "Document name",
      "description": "What this document is",
      "where_to_get": "Where/how to obtain it",
      "mandatory": true
    }}
  ],
  "test_labs": [
    {{
      "name": "Lab name",
      "location": "City, State",
      "accreditation": "NABL/BIS accredited",
      "contact": "Phone/email",
      "estimated_cost_inr": 50000
    }}
  ],
  "subsidies": [
    {{
      "name": "Subsidy scheme name",
      "provider": "Government body",
      "benefit": "Percentage or amount",
      "eligibility": "Who qualifies",
      "how_to_apply": "Application process",
      "portal_url": "URL if available"
    }}
  ],
  "common_rejection_reasons": [
    {{
      "reason": "Rejection reason",
      "how_to_avoid": "Prevention strategy"
    }}
  ],
  "mock_audit_questions": [
    {{
      "question": "Question that auditor may ask",
      "suggested_answer": "How to prepare for this question",
      "category": "documentation|process|quality|safety"
    }}
  ],
  "estimated_total_cost_inr": {{
    "min": 30000,
    "max": 150000
  }},
  "estimated_total_days": 45,
  "consultant_advice": "When to hire a consultant vs DIY, and estimated consultant fees"
}}

Be specific to the product and destination. Use REAL certification bodies, test labs, and government schemes relevant to India.
Return ONLY valid JSON."""


def generate_guidance(
    cert_id: str,
    cert_name: str,
    cert_type: str,
    product_type: str,
    destination_country: str,
    company_size: str = "Micro",
) -> dict:
    """Generate detailed certification guidance using LLM."""
    
    cache_key = f"{cert_id}_{product_type}_{destination_country}"
    if cache_key in _guidance_cache:
        logger.info(f"Returning cached guidance for {cache_key}")
        return _guidance_cache[cache_key]

    prompt = GUIDANCE_PROMPT.format(
        cert_name=cert_name,
        cert_type=cert_type,
        product_type=product_type,
        destination_country=destination_country,
        company_size=company_size,
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
        logger.info(f"Generated guidance for {cert_name}")
    except Exception as e:
        logger.error(f"Failed to generate guidance: {e}")
        data = _mock_guidance(cert_name, cert_type)

    # Normalize
    result = {
        "cert_id": cert_id,
        "cert_name": cert_name,
        "cert_type": cert_type,
        "overview": data.get("overview", ""),
        "why_required": data.get("why_required", ""),
        "steps": data.get("steps", []),
        "document_checklist": data.get("document_checklist", []),
        "test_labs": data.get("test_labs", []),
        "subsidies": data.get("subsidies", []),
        "common_rejection_reasons": data.get("common_rejection_reasons", []),
        "mock_audit_questions": data.get("mock_audit_questions", []),
        "estimated_total_cost_inr": data.get("estimated_total_cost_inr", {"min": 0, "max": 0}),
        "estimated_total_days": data.get("estimated_total_days", 30),
        "consultant_advice": data.get("consultant_advice", ""),
        "generated_at": datetime.now().isoformat(),
    }

    _guidance_cache[cache_key] = result
    return result


def _mock_guidance(cert_name: str, cert_type: str) -> dict:
    """Fallback mock guidance when LLM is unavailable."""
    return {
        "overview": f"{cert_name} is a mandatory certification for exporting products to this market.",
        "why_required": f"Regulatory compliance requires {cert_name} certification for market access.",
        "steps": [
            {"step_number": 1, "title": "Document Preparation", "description": "Gather all required documents including company registration, product specs, and test reports.", "estimated_days": 3, "documents_needed": ["Company Registration", "Product Specifications"], "tips": "Start early to avoid delays."},
            {"step_number": 2, "title": "Application Submission", "description": "Submit application through the official portal with all supporting documents.", "estimated_days": 2, "documents_needed": ["Application Form", "Fee Payment Receipt"], "tips": "Double-check all fields before submission."},
            {"step_number": 3, "title": "Product Testing", "description": "Send product samples to an accredited testing laboratory.", "estimated_days": 15, "documents_needed": ["Test Samples", "Test Request Form"], "tips": "Choose NABL-accredited labs for faster processing."},
            {"step_number": 4, "title": "Certification Issuance", "description": "After successful testing, certificate is issued.", "estimated_days": 10, "documents_needed": ["Test Report"], "tips": "Follow up weekly for status updates."},
        ],
        "document_checklist": [
            {"id": "doc_1", "name": "Company PAN Card", "description": "Permanent Account Number of the company", "where_to_get": "Income Tax Department", "mandatory": True},
            {"id": "doc_2", "name": "GST Registration", "description": "Goods and Services Tax registration certificate", "where_to_get": "GST Portal", "mandatory": True},
            {"id": "doc_3", "name": "IEC Code", "description": "Import Export Code from DGFT", "where_to_get": "DGFT Portal - dgft.gov.in", "mandatory": True},
            {"id": "doc_4", "name": "Product Test Report", "description": "Test report from accredited laboratory", "where_to_get": "NABL accredited lab", "mandatory": True},
        ],
        "test_labs": [
            {"name": "QCI Lab Mumbai", "location": "Mumbai, Maharashtra", "accreditation": "NABL Accredited", "contact": "+91 22 2600 0000", "estimated_cost_inr": 50000},
            {"name": "ERTL Delhi", "location": "New Delhi", "accreditation": "BIS Recognized", "contact": "+91 11 2600 0000", "estimated_cost_inr": 40000},
        ],
        "subsidies": [
            {"name": "ZED Certification Subsidy", "provider": "Ministry of MSME", "benefit": "80% subsidy for Micro enterprises", "eligibility": "Registered MSME with Udyam", "how_to_apply": "Apply through ZED portal", "portal_url": "https://zed.msme.gov.in"},
        ],
        "common_rejection_reasons": [
            {"reason": "Incomplete documentation", "how_to_avoid": "Use the document checklist above and verify all items before submission"},
            {"reason": "Product test failure", "how_to_avoid": "Pre-test with an informal lab before official testing"},
            {"reason": "Incorrect HS code declaration", "how_to_avoid": "Verify HS code with customs broker before applying"},
        ],
        "mock_audit_questions": [
            {"question": "What quality management system do you follow?", "suggested_answer": "Describe your QMS process, ISO certifications if any", "category": "quality"},
            {"question": "How do you ensure product consistency across batches?", "suggested_answer": "Explain batch testing procedures and quality checks", "category": "process"},
            {"question": "What are your raw material sourcing practices?", "suggested_answer": "Describe vendor qualification and incoming material inspection", "category": "process"},
        ],
        "estimated_total_cost_inr": {"min": 30000, "max": 150000},
        "estimated_total_days": 30,
        "consultant_advice": "For first-time exporters, consider hiring a consultant (₹15,000-50,000) to navigate the process. DIY is possible with this guide but may take 20% longer.",
    }
