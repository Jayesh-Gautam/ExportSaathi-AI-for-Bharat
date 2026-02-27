"""Finance Readiness service — working capital, RoDTEP, credit eligibility, cash-flow timeline."""

import logging
from datetime import datetime

from services.llm_client import llm_client

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ExportSaathi's Finance Advisor for Indian MSMEs eager to export.
You calculate working capital needs, RoDTEP benefits, pre-shipment credit eligibility, GST refund timelines.
All calculations are in INR. Use current Indian government schemes and RBI guidelines."""

FINANCE_PROMPT = """Analyze the financial readiness for this export scenario:

**Product:** {product_name}
**HS Code:** {hs_code}
**Destination:** {destination}
**Business Type:** {business_type}
**Company Size:** {company_size}
**Estimated Costs:** Certifications ₹{cert_cost}, Documentation ₹{doc_cost}, Logistics ₹{logistics_cost}

Generate a comprehensive financial analysis as JSON:
{{
  "working_capital": {{
    "product_cost": 500000,
    "certification_cost": {cert_cost},
    "logistics_cost": {logistics_cost},
    "documentation_cost": {doc_cost},
    "buffer": 100000,
    "total": 900000
  }},
  "rodtep": {{
    "applicable": true,
    "rate_percentage": 3.5,
    "estimated_benefit": 35000,
    "hs_code": "{hs_code}"
  }},
  "credit_eligibility": {{
    "eligible": true,
    "max_amount": 750000,
    "interest_rate_range": "8-12% p.a.",
    "recommended_banks": ["SBI", "Bank of Baroda", "EXIM Bank"]
  }},
  "cash_flow_timeline": [
    {{"month": 1, "label": "Month 1 - Preparation", "inflow": 0, "outflow": 350000, "balance": -350000}},
    {{"month": 2, "label": "Month 2 - Production", "inflow": 0, "outflow": 400000, "balance": -750000}},
    {{"month": 3, "label": "Month 3 - Shipping", "inflow": 0, "outflow": 150000, "balance": -900000}},
    {{"month": 4, "label": "Month 4 - Payment", "inflow": 1200000, "outflow": 0, "balance": 300000}},
    {{"month": 5, "label": "Month 5 - Refunds", "inflow": 135000, "outflow": 0, "balance": 435000}},
    {{"month": 6, "label": "Month 6 - Settled", "inflow": 0, "outflow": 0, "balance": 435000}}
  ],
  "gst_refund": {{
    "estimated_amount": 100000,
    "estimated_days": 60
  }},
  "liquidity_gap": {{
    "exists": true,
    "gap_amount": 900000,
    "gap_period_days": 90,
    "suggestions": [
      "Apply for pre-shipment credit from SBI/BOB",
      "Use ECGC export credit guarantee scheme",
      "Consider factoring/invoice discounting"
    ]
  }},
  "currency_hedging": "For exports worth over ₹25L, consider forward contracts to hedge against INR appreciation. Current INR/USD rate is volatile — lock in rates for 3-month forward."
}}

Be specific with numbers based on the product and destination. Return ONLY valid JSON."""


def analyze_finance(report_data: dict) -> dict:
    """Generate finance readiness analysis."""
    prompt = FINANCE_PROMPT.format(
        product_name=report_data.get("product_name", "Unknown"),
        hs_code=report_data.get("hs_code", "0000.00"),
        destination=report_data.get("destination_country", "Unknown"),
        business_type=report_data.get("business_type", "Manufacturing"),
        company_size=report_data.get("company_size", "Micro"),
        cert_cost=report_data.get("certification_cost", 100000),
        doc_cost=report_data.get("documentation_cost", 25000),
        logistics_cost=report_data.get("logistics_cost", 150000),
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
        logger.info("Generated finance analysis")
    except Exception as e:
        logger.error(f"Finance analysis failed: {e}")
        data = _mock_finance(report_data)

    return {**data, "generated_at": datetime.now().isoformat()}


def _mock_finance(report_data: dict) -> dict:
    """Fallback finance analysis."""
    cert = report_data.get("certification_cost", 100000)
    doc = report_data.get("documentation_cost", 25000)
    log = report_data.get("logistics_cost", 150000)
    prod = 500000
    buf = 100000
    total = prod + cert + log + doc + buf

    return {
        "working_capital": {
            "product_cost": prod, "certification_cost": cert,
            "logistics_cost": log, "documentation_cost": doc,
            "buffer": buf, "total": total,
        },
        "rodtep": {"applicable": True, "rate_percentage": 3.0, "estimated_benefit": int(total * 0.03), "hs_code": report_data.get("hs_code", "")},
        "credit_eligibility": {"eligible": True, "max_amount": int(total * 0.8), "interest_rate_range": "8-12% p.a.", "recommended_banks": ["SBI", "Bank of Baroda", "EXIM Bank"]},
        "cash_flow_timeline": [
            {"month": 1, "label": "Preparation", "inflow": 0, "outflow": cert + doc, "balance": -(cert + doc)},
            {"month": 2, "label": "Production", "inflow": 0, "outflow": prod, "balance": -(cert + doc + prod)},
            {"month": 3, "label": "Shipping", "inflow": 0, "outflow": log, "balance": -total + buf},
            {"month": 4, "label": "Payment", "inflow": int(total * 1.4), "outflow": 0, "balance": int(total * 0.4)},
            {"month": 5, "label": "Refunds", "inflow": int(total * 0.08), "outflow": 0, "balance": int(total * 0.48)},
        ],
        "gst_refund": {"estimated_amount": int(total * 0.12), "estimated_days": 60},
        "liquidity_gap": {"exists": True, "gap_amount": total, "gap_period_days": 90, "suggestions": ["Apply for pre-shipment credit", "Use ECGC guarantee", "Consider invoice factoring"]},
        "currency_hedging": "Consider forward contracts for shipments above ₹25L to hedge against currency fluctuations.",
    }
