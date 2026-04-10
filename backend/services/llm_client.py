"""LLM Client service wrapping Groq API for ExportSaathi."""

import json
import logging
import hashlib
from typing import Optional

from config import settings
from services.redis_client import redis_client

logger = logging.getLogger(__name__)


class LLMClient:
    """Unified synchronous LLM client using Groq API with Redis caching and fallback to mock data."""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.client = None

        if self.api_key and self.api_key != "your_groq_api_key_here":
            try:
                from groq import Groq
                self.client = Groq(api_key=self.api_key)
                logger.info(f"Groq client initialized with model: {self.model}")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")
        else:
            logger.warning(
                "No GROQ_API_KEY configured. LLM will return mock responses. "
                "Get a free key at https://console.groq.com"
            )

    @property
    def is_available(self) -> bool:
        return self.client is not None

    def _generate_cache_key(self, prefix: str, request_data: dict) -> str:
        """Generate a unique cache key based on the request content."""
        data_str = json.dumps(request_data, sort_keys=True)
        hash_str = hashlib.md5(data_str.encode()).hexdigest()
        return f"{prefix}:{self.model}:{hash_str}"

    def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 4096,
        cache_ttl: int = 86400 * 7, # 7 days default
    ) -> str:
        """Generate text response from LLM."""
        if not self.is_available:
            return self._mock_response(prompt)
            
        request_data = {
            "prompt": prompt,
            "system_prompt": system_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        # Check cache
        cache_key = self._generate_cache_key("llm_gen", request_data)
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for generate: {cache_key}")
            return cached_result

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            result = response.choices[0].message.content
            
            # Save to cache
            redis_client.set(cache_key, result, expire=cache_ttl)
            return result
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def generate_json(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float = 0.3,
        max_tokens: int = 8192,
        cache_ttl: int = 86400 * 7, # 7 days cache
    ) -> dict:
        """Generate structured JSON response from LLM."""
        if not self.is_available:
            return self._mock_json_response(prompt)
            
        request_data = {
            "prompt": prompt,
            "system_prompt": system_prompt,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "json": True
        }
        
        # Check cache
        cache_key = self._generate_cache_key("llm_json", request_data)
        cached_result = redis_client.get(cache_key)
        if cached_result:
            logger.debug(f"Cache hit for generate_json: {cache_key}")
            try:
                return json.loads(cached_result)
            except json.JSONDecodeError:
                pass # corrupted cache, re-fetch

        try:
            messages = []
            if system_prompt:
                messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "user", "content": prompt})

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"},
            )

            content = response.choices[0].message.content
            result = json.loads(content)
            
            # Save to cache
            redis_client.set(cache_key, json.dumps(result), expire=cache_ttl)
            return result
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM JSON response: {e}")
            raise
        except Exception as e:
            logger.error(f"LLM JSON generation failed: {e}")
            raise

    def chat(
        self,
        messages: list,
        system_prompt: str = "",
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Generate chat response with conversation history (responses typically not cached)."""
        if not self.is_available:
            return "I'm running in demo mode without an LLM API key. Please configure your GROQ_API_KEY in the .env file to get real AI-powered responses. Get a free key at https://console.groq.com"

        # Chat history is dynamic, caching relies too much on entire conversation state.
        try:
            all_messages = []
            if system_prompt:
                all_messages.append({"role": "system", "content": system_prompt})
            all_messages.extend(messages)

            response = self.client.chat.completions.create(
                model=self.model,
                messages=all_messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM chat failed: {e}")
            raise

    def _mock_response(self, prompt: str) -> str:
        return (
            "This is a demo response. Configure GROQ_API_KEY in .env for real AI responses. "
            "Get a free API key at https://console.groq.com"
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
