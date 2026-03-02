"""LLM Client service wrapping AWS Bedrock for ExportSaathi.

Supports any Bedrock model via the unified Converse API.
Switch models by changing BEDROCK_MODEL_ID in .env:
  - amazon.nova-lite-v1:0      (fast, cheap — default)
  - amazon.nova-pro-v1:0       (better quality)
  - anthropic.claude-3-haiku-20240307-v1:0  (Claude 3 Haiku)
  - anthropic.claude-3-sonnet-20240229-v1:0 (Claude 3 Sonnet)
  - meta.llama3-70b-instruct-v1:0           (Llama 3 70B)
"""

import json
import logging
from typing import Optional

from config import settings

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified LLM client using AWS Bedrock Converse API with fallback to mock data."""

    def __init__(self):
        self.region = settings.AWS_REGION
        self.model_id = settings.BEDROCK_MODEL_ID
        self.client = None

        try:
            import boto3
            session_kwargs = {"region_name": self.region}
            if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
                session_kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
                session_kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY

            session = boto3.Session(**session_kwargs)
            self.client = session.client("bedrock-runtime")
            # Quick validation — list the model to confirm access
            logger.info(f"Bedrock client initialized | region={self.region} model={self.model_id}")
        except Exception as e:
            logger.warning(
                f"Failed to initialize Bedrock client: {e}. "
                "LLM will return mock responses. "
                "Ensure AWS credentials are configured and Bedrock model access is enabled."
            )

    @property
    def is_available(self) -> bool:
        return self.client is not None

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 4096,
    ) -> str:
        """Generate text response from LLM."""
        if not self.is_available:
            return self._mock_response(prompt)

        try:
            messages = [{"role": "user", "content": [{"text": prompt}]}]
            kwargs = {
                "modelId": self.model_id,
                "messages": messages,
                "inferenceConfig": {
                    "temperature": temperature,
                    "maxTokens": max_tokens,
                },
            }
            if system_prompt:
                kwargs["system"] = [{"text": system_prompt}]

            response = self.client.converse(**kwargs)
            return response["output"]["message"]["content"][0]["text"]
        except Exception as e:
            logger.error(f"Bedrock generation failed: {e}")
            raise

    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.3,
        max_tokens: int = 8192,
    ) -> dict:
        """Generate structured JSON response from LLM."""
        if not self.is_available:
            return self._mock_json_response(prompt)

        # Append JSON instruction to system prompt for models that don't have
        # a native json_object mode in the Converse API.
        json_system = system_prompt + (
            "\n\nIMPORTANT: You MUST respond with ONLY valid JSON. "
            "No markdown, no commentary, no code fences — just the raw JSON object."
        )

        try:
            messages = [{"role": "user", "content": [{"text": prompt}]}]
            kwargs = {
                "modelId": self.model_id,
                "messages": messages,
                "inferenceConfig": {
                    "temperature": temperature,
                    "maxTokens": max_tokens,
                },
            }
            if json_system:
                kwargs["system"] = [{"text": json_system}]

            response = self.client.converse(**kwargs)
            content = response["output"]["message"]["content"][0]["text"]

            # Strip markdown code fences if the model included them
            content = content.strip()
            if content.startswith("```"):
                lines = content.split("\n")
                # Remove first and last lines (```json and ```)
                lines = [l for l in lines if not l.strip().startswith("```")]
                content = "\n".join(lines)

            return json.loads(content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Bedrock JSON response: {e}")
            raise
        except Exception as e:
            logger.error(f"Bedrock JSON generation failed: {e}")
            raise

    def chat(
        self,
        messages: list,
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Generate chat response with conversation history."""
        if not self.is_available:
            return (
                "I'm running in demo mode without AWS Bedrock access. "
                "Please configure your AWS credentials in the .env file "
                "and ensure Bedrock model access is enabled in the AWS console."
            )

        try:
            # Convert OpenAI-style messages to Bedrock Converse format
            bedrock_messages = []
            for msg in messages:
                role = msg.get("role", "user")
                if role == "system":
                    continue  # system goes separately
                bedrock_messages.append({
                    "role": role,
                    "content": [{"text": msg.get("content", "")}],
                })

            # Ensure messages alternate user/assistant (Bedrock requirement)
            bedrock_messages = self._ensure_alternating(bedrock_messages)

            kwargs = {
                "modelId": self.model_id,
                "messages": bedrock_messages,
                "inferenceConfig": {
                    "temperature": temperature,
                    "maxTokens": max_tokens,
                },
            }
            if system_prompt:
                kwargs["system"] = [{"text": system_prompt}]

            response = self.client.converse(**kwargs)
            return response["output"]["message"]["content"][0]["text"]
        except Exception as e:
            logger.error(f"Bedrock chat failed: {e}")
            raise

    def _ensure_alternating(self, messages: list) -> list:
        """Ensure messages alternate between user and assistant roles.
        Bedrock Converse API requires strict alternation."""
        if not messages:
            return [{"role": "user", "content": [{"text": "Hello"}]}]

        fixed = [messages[0]]
        for msg in messages[1:]:
            if msg["role"] == fixed[-1]["role"]:
                # Merge consecutive same-role messages
                fixed[-1]["content"][0]["text"] += "\n" + msg["content"][0]["text"]
            else:
                fixed.append(msg)

        # Must start with user
        if fixed[0]["role"] != "user":
            fixed.insert(0, {"role": "user", "content": [{"text": "Continue the conversation."}]})

        return fixed

    def _mock_response(self, prompt: str) -> str:
        return (
            "This is a demo response. Configure AWS credentials in .env "
            "and enable Bedrock model access for real AI responses."
        )

    def _mock_json_response(self, prompt: str) -> dict:
        """Return a complete mock report for demo purposes."""
        return {
            "hs_code": {
                "code": "8539.50",
                "confidence": 85.0,
                "description": "LED lamps and lighting fittings",
                "alternatives": [
                    {"code": "9405.40", "confidence": 60.0, "description": "Other electric lamps and lighting fittings"},
                    {"code": "8543.70", "confidence": 45.0, "description": "Other electrical machines and apparatus"},
                ],
            },
            "certifications": [
                {
                    "id": "cert_bis",
                    "name": "BIS Certification (IS 16102)",
                    "type": "BIS",
                    "mandatory": True,
                    "estimated_cost": {"min": 50000, "max": 150000, "currency": "INR"},
                    "estimated_timeline_days": 45,
                    "priority": "high",
                },
                {
                    "id": "cert_ce",
                    "name": "CE Marking",
                    "type": "CE",
                    "mandatory": True,
                    "estimated_cost": {"min": 100000, "max": 300000, "currency": "INR"},
                    "estimated_timeline_days": 60,
                    "priority": "high",
                },
                {
                    "id": "cert_zed",
                    "name": "ZED Certification",
                    "type": "ZED",
                    "mandatory": False,
                    "estimated_cost": {"min": 10000, "max": 50000, "currency": "INR"},
                    "estimated_timeline_days": 30,
                    "priority": "medium",
                },
            ],
            "restricted_substances": [
                {"name": "Lead (Pb)", "reason": "RoHS directive limits lead content to 0.1%", "regulation": "EU RoHS Directive 2011/65/EU"},
                {"name": "Mercury (Hg)", "reason": "Restricted in lighting products", "regulation": "EU RoHS Directive"},
            ],
            "past_rejections": [
                {"product_type": "LED lights", "reason": "Failed LM-79 photometric testing", "source": "other", "date": "2024-06"},
                {"product_type": "LED bulbs", "reason": "Non-compliant labeling", "source": "FDA", "date": "2024-03"},
            ],
            "compliance_roadmap": [
                {"step": 1, "title": "GST LUT Application", "description": "Apply for Letter of Undertaking to export without IGST", "duration_days": 1, "dependencies": []},
                {"step": 2, "title": "HS Code Confirmation", "description": "Verify HS code with customs broker", "duration_days": 1, "dependencies": []},
                {"step": 3, "title": "BIS Certification Application", "description": "Submit application with test reports", "duration_days": 45, "dependencies": ["1"]},
                {"step": 4, "title": "CE Marking Assessment", "description": "Engage notified body for conformity assessment", "duration_days": 60, "dependencies": ["2"]},
            ],
            "risks": [
                {"title": "RoHS Non-Compliance", "description": "LED products must meet EU RoHS restricted substance limits", "severity": "high", "mitigation": "Get products tested at NABL-accredited lab for RoHS compliance"},
                {"title": "Labeling Rejection", "description": "Incorrect or missing product labeling is a common rejection cause", "severity": "medium", "mitigation": "Follow destination country labeling requirements precisely"},
                {"title": "Customs RMS Flag", "description": "First-time exporters have higher RMS check probability", "severity": "medium", "mitigation": "Ensure all documentation is accurate and consistent"},
            ],
            "risk_score": 42,
            "timeline": {
                "estimated_days": 60,
                "breakdown": [
                    {"phase": "Registration & GST LUT", "duration_days": 3},
                    {"phase": "Product Testing", "duration_days": 15},
                    {"phase": "Certification Applications", "duration_days": 30},
                    {"phase": "Document Preparation", "duration_days": 7},
                    {"phase": "Logistics & Shipping", "duration_days": 5},
                ],
            },
            "costs": {
                "certifications": 250000,
                "documentation": 15000,
                "logistics": 80000,
                "total": 345000,
                "currency": "INR",
            },
            "subsidies": [
                {"name": "ZED Certification Subsidy", "type": "Government", "amount": 40000, "eligibility": "Micro enterprises get 80% subsidy, Small get 60%", "how_to_apply": "Apply through ZED portal at zed.msme.gov.in"},
                {"name": "RoDTEP Benefit", "type": "Tax Refund", "amount": 25000, "eligibility": "All exporters of goods with valid HS code", "how_to_apply": "Automatic credit through ICEGATE after shipping bill filing"},
            ],
            "action_plan": {
                "days": [
                    {"day": 1, "title": "Registration & Setup", "tasks": [
                        {"id": "t1_1", "title": "Apply for GST LUT", "description": "File Letter of Undertaking on GST portal to export without paying IGST", "category": "documentation", "completed": False, "estimated_duration": "2 hours"},
                        {"id": "t1_2", "title": "Confirm HS Code", "description": "Verify HS code 8539.50 with a customs broker", "category": "documentation", "completed": False, "estimated_duration": "1 hour"},
                    ]},
                    {"day": 2, "title": "Certification Planning", "tasks": [
                        {"id": "t2_1", "title": "Contact BIS Office", "description": "Reach out to nearest BIS office for IS 16102 certification process", "category": "certification", "completed": False, "estimated_duration": "3 hours"},
                        {"id": "t2_2", "title": "Identify Test Labs", "description": "Shortlist NABL-accredited test labs for product testing", "category": "certification", "completed": False, "estimated_duration": "2 hours"},
                    ]},
                    {"day": 3, "title": "Testing Initiation", "tasks": [
                        {"id": "t3_1", "title": "Submit Samples for Testing", "description": "Send product samples to selected test lab for safety and performance testing", "category": "certification", "completed": False, "estimated_duration": "4 hours"},
                    ]},
                    {"day": 4, "title": "Documentation", "tasks": [
                        {"id": "t4_1", "title": "Prepare Commercial Invoice", "description": "Create commercial invoice with all mandatory fields", "category": "documentation", "completed": False, "estimated_duration": "2 hours"},
                        {"id": "t4_2", "title": "Prepare Packing List", "description": "Create detailed packing list matching invoice", "category": "documentation", "completed": False, "estimated_duration": "1 hour"},
                    ]},
                    {"day": 5, "title": "Documentation & Finance", "tasks": [
                        {"id": "t5_1", "title": "Apply for RoDTEP Registration", "description": "Register on ICEGATE for RoDTEP benefit claims", "category": "finance", "completed": False, "estimated_duration": "2 hours"},
                        {"id": "t5_2", "title": "Prepare Shipping Bill Draft", "description": "Draft shipping bill with accurate product and customs details", "category": "documentation", "completed": False, "estimated_duration": "2 hours"},
                    ]},
                    {"day": 6, "title": "Logistics Planning", "tasks": [
                        {"id": "t6_1", "title": "Get Freight Quotes", "description": "Contact minimum 3 freight forwarders for competitive quotes", "category": "logistics", "completed": False, "estimated_duration": "3 hours"},
                        {"id": "t6_2", "title": "Arrange Insurance", "description": "Get marine cargo insurance for shipment value", "category": "logistics", "completed": False, "estimated_duration": "1 hour"},
                    ]},
                    {"day": 7, "title": "Final Review", "tasks": [
                        {"id": "t7_1", "title": "Document Cross-Check", "description": "Verify all documents are consistent and complete", "category": "documentation", "completed": False, "estimated_duration": "3 hours"},
                        {"id": "t7_2", "title": "Readiness Checklist", "description": "Complete final export readiness checklist", "category": "documentation", "completed": False, "estimated_duration": "1 hour"},
                    ]},
                ],
                "progress_percentage": 0,
            },
            "retrieved_sources": [
                {"title": "DGFT Handbook of Procedures", "source": "DGFT", "relevance_score": 0.92},
                {"title": "BIS Certification Scheme I", "source": "Bureau of Indian Standards", "relevance_score": 0.88},
                {"title": "EU RoHS Directive 2011/65/EU", "source": "European Commission", "relevance_score": 0.85},
            ],
        }


# Singleton instance
llm_client = LLMClient()
