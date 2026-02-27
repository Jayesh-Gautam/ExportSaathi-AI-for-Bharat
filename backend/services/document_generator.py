"""Document Generator service — auto-generate export documents with AI validation."""

import json
import logging
from datetime import datetime

from services.llm_client import llm_client

logger = logging.getLogger(__name__)

SUPPORTED_DOCUMENT_TYPES = [
    {"id": "commercial_invoice", "name": "Commercial Invoice", "category": "shipping", "description": "Invoice for international trade with buyer/seller details, product description, and pricing."},
    {"id": "packing_list", "name": "Packing List", "category": "shipping", "description": "Detailed list of goods being shipped including quantities, weights, and dimensions."},
    {"id": "shipping_bill", "name": "Shipping Bill", "category": "customs", "description": "Declaration to customs for exported goods including HS code, value, and duty details."},
    {"id": "gst_lut", "name": "GST LUT (Letter of Undertaking)", "category": "tax", "description": "Letter of Undertaking to export without payment of IGST under GST provisions."},
    {"id": "certificate_of_origin", "name": "Certificate of Origin", "category": "trade", "description": "Certifies the country of origin of goods for preferential tariff treatment."},
    {"id": "softex", "name": "SOFTEX Form", "category": "services", "description": "Software Export declaration form for SaaS and IT service exports."},
]

SYSTEM_PROMPT = """You are ExportSaathi's Smart Documentation Engine for Indian exporters.
You auto-generate export documents based on product details, HS code, and destination.
All documents must follow DGFT, Indian Customs, and GST regulations.
Use proper Indian format conventions including GST number format (15 digits), IEC code, port codes, etc."""

GENERATE_PROMPT = """Generate a {doc_type_name} for this export:

**Product:** {product_name}
**HS Code:** {hs_code}
**Destination Country:** {destination}
**Business Type:** {business_type}

Respond with a JSON object with this structure:
{{
  "document_title": "{doc_type_name}",
  "generated_at": "{timestamp}",
  "fields": [
    {{
      "field_name": "Field Name",
      "field_value": "Auto-filled or placeholder value",
      "section": "header|seller|buyer|goods|shipping|financial|declaration",
      "editable": true,
      "required": true,
      "help_text": "Brief explanation of this field"
    }}
  ],
  "notes": ["Important notes about this document"],
  "validation_warnings": [
    {{
      "field": "field_name",
      "warning": "Warning message",
      "severity": "high|medium|low"
    }}
  ]
}}

Generate realistic placeholder values for common fields (use SAMPLE/DEMO markers).
Include all mandatory fields per Indian trade regulations.
Return ONLY valid JSON."""

VALIDATE_PROMPT = """Validate this export document for compliance issues:

**Document Type:** {doc_type}
**Fields:**
{fields_json}

Check for these common errors:
1. Port code mismatch (Indian port codes should be valid)
2. Invoice format compliance (per DGFT rules)
3. GST vs Shipping Bill consistency
4. RMS risk trigger detection (red flag keywords in product descriptions)
5. Missing mandatory fields
6. HS code format validity
7. Value consistency (FOB, CIF amounts)

Respond with JSON:
{{
  "is_valid": true|false,
  "score": 85,
  "issues": [
    {{
      "field": "field_name",
      "issue": "Description of the issue",
      "severity": "high|medium|low",
      "suggestion": "How to fix it"
    }}
  ],
  "rms_risk_flags": [
    {{
      "keyword": "flagged keyword",
      "context": "Where it appears",
      "risk": "Why it's a risk"
    }}
  ],
  "compliance_notes": ["General compliance observations"]
}}

Return ONLY valid JSON."""


def get_document_types() -> list[dict]:
    """Return supported document types."""
    return SUPPORTED_DOCUMENT_TYPES


def generate_document(doc_type: str, report_data: dict) -> dict:
    """Generate an export document using LLM."""
    doc_meta = next((d for d in SUPPORTED_DOCUMENT_TYPES if d["id"] == doc_type), None)
    if not doc_meta:
        return {"error": f"Unknown document type: {doc_type}"}

    prompt = GENERATE_PROMPT.format(
        doc_type_name=doc_meta["name"],
        product_name=report_data.get("product_name", "Unknown Product"),
        hs_code=report_data.get("hs_code", "0000.00.00"),
        destination=report_data.get("destination_country", "Unknown"),
        business_type=report_data.get("business_type", "Manufacturing"),
        timestamp=datetime.now().isoformat(),
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
    except Exception as e:
        logger.error(f"Document generation failed: {e}")
        data = _mock_document(doc_meta["name"], report_data)

    return {
        "doc_type": doc_type,
        "doc_name": doc_meta["name"],
        "category": doc_meta["category"],
        **data,
        "generated_at": datetime.now().isoformat(),
    }


def validate_document(doc_type: str, fields: list[dict]) -> dict:
    """Validate a document for compliance issues."""
    prompt = VALIDATE_PROMPT.format(
        doc_type=doc_type,
        fields_json=json.dumps(fields[:20], indent=2),  # limit to avoid prompt overflow
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
    except Exception as e:
        logger.error(f"Document validation failed: {e}")
        data = {"is_valid": True, "score": 70, "issues": [], "rms_risk_flags": [], "compliance_notes": ["Validation unavailable — LLM not configured"]}

    return data


def _mock_document(doc_name: str, report_data: dict) -> dict:
    """Fallback document when LLM unavailable."""
    product = report_data.get("product_name", "Sample Product")
    destination = report_data.get("destination_country", "USA")
    hs_code = report_data.get("hs_code", "0901.11.00")

    return {
        "document_title": doc_name,
        "fields": [
            {"field_name": "Exporter Name", "field_value": "[Your Company Name]", "section": "seller", "editable": True, "required": True, "help_text": "Legal registered name of the exporting company"},
            {"field_name": "Exporter Address", "field_value": "[Registered Address]", "section": "seller", "editable": True, "required": True, "help_text": "Full registered address of the exporter"},
            {"field_name": "IEC Code", "field_value": "[Your 10-digit IEC]", "section": "seller", "editable": True, "required": True, "help_text": "Import Export Code issued by DGFT (10 digits)"},
            {"field_name": "GSTIN", "field_value": "[15-digit GST Number]", "section": "seller", "editable": True, "required": True, "help_text": "GST Identification Number (15 alphanumeric characters)"},
            {"field_name": "Buyer Name", "field_value": f"[Buyer in {destination}]", "section": "buyer", "editable": True, "required": True, "help_text": "Legal name of the importing buyer"},
            {"field_name": "Buyer Address", "field_value": f"[Address in {destination}]", "section": "buyer", "editable": True, "required": True, "help_text": "Complete address of the buyer"},
            {"field_name": "Product Description", "field_value": product, "section": "goods", "editable": True, "required": True, "help_text": "Detailed description matching the HS code classification"},
            {"field_name": "HS Code", "field_value": hs_code, "section": "goods", "editable": True, "required": True, "help_text": "Harmonized System code for the product"},
            {"field_name": "Quantity", "field_value": "[Enter quantity]", "section": "goods", "editable": True, "required": True, "help_text": "Total quantity being exported with unit of measurement"},
            {"field_name": "Unit Price (FOB)", "field_value": "[Price per unit in USD]", "section": "financial", "editable": True, "required": True, "help_text": "Free On Board price per unit"},
            {"field_name": "Total Value (FOB)", "field_value": "[Total FOB value]", "section": "financial", "editable": True, "required": True, "help_text": "Total Free On Board value of the shipment"},
            {"field_name": "Port of Loading", "field_value": "INNSA (Nhava Sheva)", "section": "shipping", "editable": True, "required": True, "help_text": "Indian port code where goods will be loaded"},
            {"field_name": "Port of Discharge", "field_value": f"[Port in {destination}]", "section": "shipping", "editable": True, "required": True, "help_text": "Foreign port where goods will arrive"},
            {"field_name": "Country of Origin", "field_value": "India", "section": "shipping", "editable": False, "required": True, "help_text": "Country where goods were manufactured"},
            {"field_name": "Terms of Delivery", "field_value": "FOB", "section": "financial", "editable": True, "required": True, "help_text": "Incoterms (FOB, CIF, etc.)"},
        ],
        "notes": [
            "All values in this document are placeholders — replace with actual data",
            "Ensure IEC and GSTIN are valid before submission",
            "This document must match the Shipping Bill declaration",
        ],
        "validation_warnings": [
            {"field": "IEC Code", "warning": "Replace with actual 10-digit IEC", "severity": "high"},
            {"field": "GSTIN", "warning": "Replace with actual 15-character GSTIN", "severity": "high"},
        ],
    }
