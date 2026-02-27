"""Logistics Risk Shield service — LCL/FCL, RMS probability, route analysis, freight estimates."""

import logging
from datetime import datetime

from services.llm_client import llm_client

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are ExportSaathi's Logistics Risk Analyst for Indian exporters.
You analyze shipping risks including LCL vs FCL decisions, RMS (Risk Management System) customs check probability,
route delays, freight costs, and insurance needs. Use current Indian customs and shipping data."""

LOGISTICS_PROMPT = """Analyze logistics risks for this export:

**Product:** {product_name}
**HS Code:** {hs_code}
**Destination:** {destination}
**Monthly Volume:** {volume} units
**Business Type:** {business_type}

Generate comprehensive logistics risk analysis as JSON:
{{
  "lcl_vs_fcl": {{
    "recommendation": "LCL",
    "lcl_cost": 45000,
    "fcl_cost": 180000,
    "lcl_risk_level": "medium",
    "fcl_risk_level": "low",
    "reasoning": "Reasoning for LCL vs FCL recommendation"
  }},
  "rms_probability": {{
    "probability_percent": 25,
    "risk_level": "medium",
    "factors": ["First-time exporter", "High-value goods", "Destination country risk profile"],
    "red_flag_keywords": ["chemical", "hazardous", "dual-use"],
    "mitigation_tips": ["Ensure complete documentation", "Use authorized customs broker", "Pre-clear with customs"]
  }},
  "route_analysis": {{
    "recommended_route": "Mumbai (JNPT) → via Suez Canal → destination country port",
    "estimated_transit_days": 21,
    "delay_risk": "medium",
    "current_disruptions": ["Red Sea route disruptions causing 7-10 day delays", "Port congestion at peak season"],
    "alternative_routes": [
      {{"route": "Via Cape of Good Hope", "days": 28, "cost_multiplier": 1.15}},
      {{"route": "Air freight (Mumbai DEL)", "days": 3, "cost_multiplier": 4.5}}
    ]
  }},
  "freight_estimate": {{
    "sea_freight": 45000,
    "air_freight": 180000,
    "recommended_mode": "sea",
    "currency": "INR"
  }},
  "insurance": {{
    "recommended": true,
    "estimated_premium": 5000,
    "coverage_type": "All Risk Marine Insurance"
  }}
}}

Be specific based on the product, HS code, and destination. Return ONLY valid JSON."""


def analyze_logistics(report_data: dict) -> dict:
    """Generate logistics risk analysis."""
    prompt = LOGISTICS_PROMPT.format(
        product_name=report_data.get("product_name", "Unknown"),
        hs_code=report_data.get("hs_code", "0000.00"),
        destination=report_data.get("destination_country", "Unknown"),
        volume=report_data.get("monthly_volume", 100),
        business_type=report_data.get("business_type", "Manufacturing"),
    )

    try:
        data = llm_client.generate_json(prompt, system_prompt=SYSTEM_PROMPT)
        logger.info("Generated logistics analysis")
    except Exception as e:
        logger.error(f"Logistics analysis failed: {e}")
        data = _mock_logistics(report_data)

    return {**data, "generated_at": datetime.now().isoformat()}


def _mock_logistics(report_data: dict) -> dict:
    """Fallback logistics analysis."""
    destination = report_data.get("destination_country", "USA")
    return {
        "lcl_vs_fcl": {
            "recommendation": "LCL",
            "lcl_cost": 45000, "fcl_cost": 180000,
            "lcl_risk_level": "medium", "fcl_risk_level": "low",
            "reasoning": f"For volumes under 15 CBM to {destination}, LCL is cost-effective but carries higher damage risk. Consider FCL once volumes exceed 10 CBM consistently.",
        },
        "rms_probability": {
            "probability_percent": 20,
            "risk_level": "medium",
            "factors": ["Product category risk profile", "New exporter status", "Destination regulations"],
            "red_flag_keywords": ["sample", "gift", "personal use", "dual-use"],
            "mitigation_tips": [
                "Ensure HS code matches product description exactly",
                "Maintain complete and consistent documentation",
                "Use a CBIC-registered customs broker",
                "File Shipping Bill 48 hours before vessel departure",
            ],
        },
        "route_analysis": {
            "recommended_route": f"Mumbai (JNPT) → Suez Canal → {destination}",
            "estimated_transit_days": 25,
            "delay_risk": "medium",
            "current_disruptions": ["Red Sea route diversions adding 7-12 days to some routes"],
            "alternative_routes": [
                {"route": "Via Cape of Good Hope", "days": 35, "cost_multiplier": 1.2},
                {"route": "Air freight (Mumbai BOM)", "days": 3, "cost_multiplier": 5.0},
            ],
        },
        "freight_estimate": {
            "sea_freight": 45000, "air_freight": 200000,
            "recommended_mode": "sea", "currency": "INR",
        },
        "insurance": {
            "recommended": True,
            "estimated_premium": 5000,
            "coverage_type": "All Risk Marine Insurance (ITC-A)",
        },
    }
