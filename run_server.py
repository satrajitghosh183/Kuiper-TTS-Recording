#!/usr/bin/env python3
"""Convenience script to start the Kuiper TTS backend API server."""
import os
import sys
from pathlib import Path

# Add backend to path so we can run from project root
backend_dir = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(backend_dir))
os.chdir(backend_dir)

if __name__ == "__main__":
    import uvicorn
    from core.config import get_settings

    settings = get_settings()
    uvicorn.run(
        "api.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
    )
