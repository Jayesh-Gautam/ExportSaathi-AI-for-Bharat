"""ExportSaathi API - Main Application Entry Point."""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import reports, chat, certifications, documents, finance, logistics

# Configure logging
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    description="AI-Powered Export Compliance & Certification Co-Pilot for Indian MSMEs",
    version="0.2.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(reports.router)
app.include_router(chat.router)
app.include_router(certifications.router)
app.include_router(documents.router)
app.include_router(finance.router)
app.include_router(logistics.router)


@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": f"{settings.APP_NAME} API is running",
        "version": "0.1.0",
    }


@app.get("/api/status")
async def api_status():
    """Check API and LLM service status."""
    from services.llm_client import llm_client
    return {
        "api": "running",
        "llm_available": llm_client.is_available,
        "llm_model": settings.BEDROCK_MODEL_ID if llm_client.is_available else "mock",
    }
