# Kuiper TTS API Server
# FastAPI server for audio recording web application

import logging
import sys
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager
from time import time

# Add parent directories to path for imports
_current_dir = Path(__file__).parent.resolve()
_backend_dir = _current_dir.parent

if str(_backend_dir) not in sys.path:
    sys.path.insert(0, str(_backend_dir))

import subprocess
import tempfile

from core.config import get_settings
from core.audio_processor import analyze_wav_bytes

settings = get_settings()

# Configure logging
log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
logging.basicConfig(
    level=log_level,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('kuiper.api')

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field
from starlette.exceptions import HTTPException as StarletteHTTPException

import db


# ============================================================================
# App Lifespan
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Starting Kuiper TTS API server...")
    # Supabase client is initialized lazily in db.py
    yield
    logger.info("Shutting down Kuiper TTS API server...")


app = FastAPI(
    title="Kuiper TTS API",
    description="API for Kuiper TTS voice recording",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Rate limiting state
_rate_limit_store: dict = {}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Simple rate limiting middleware."""
    if settings.is_production and settings.rate_limit_per_minute > 0:
        client_ip = request.client.host if request.client else "unknown"
        current_time = time()
        minute_ago = current_time - 60

        if client_ip not in _rate_limit_store:
            _rate_limit_store[client_ip] = []

        _rate_limit_store[client_ip] = [
            t for t in _rate_limit_store[client_ip] if t > minute_ago
        ]

        if len(_rate_limit_store[client_ip]) >= settings.rate_limit_per_minute:
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. Please try again later."}
            )

        _rate_limit_store[client_ip].append(current_time)

    response = await call_next(request)
    return response


# ============================================================================
# Exception Handlers
# ============================================================================

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning(f"HTTP {exc.status_code}: {exc.detail}")
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning(f"Validation error: {exc.errors()}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Validation error", "errors": exc.errors()}
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    error_detail = str(exc) if settings.debug else "An internal error occurred"
    return JSONResponse(status_code=500, content={"detail": error_detail})


# ============================================================================
# Admin Auth Dependency
# ============================================================================

def require_admin(request: Request):
    """Check admin password from header."""
    password = request.headers.get("X-Admin-Key")
    if password != settings.admin_password:
        raise HTTPException(403, "Invalid admin password")


# ============================================================================
# JWT Auth for Recording Endpoints (JWKS / ECC P-256)
# ============================================================================

_jwks_client = None


def _get_jwks_client():
    """Lazy-init JWKS client for Supabase JWT verification (JWKS / ECC P-256)."""
    global _jwks_client
    if _jwks_client is None:
        if not settings.supabase_url:
            raise HTTPException(503, "SUPABASE_URL not configured")
        jwks_url = settings.supabase_url.rstrip("/") + "/auth/v1/.well-known/jwks.json"
        from jwt import PyJWKClient
        _jwks_client = PyJWKClient(jwks_url, cache_keys=True, lifespan=600)
    return _jwks_client


def get_current_user_id(request: Request) -> str:
    """Extract user_id from Supabase JWT (JWKS/ECC). Required for recording endpoints."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(401, "Authorization required. Please sign in.")

    token = auth_header[7:].strip()
    if not token:
        raise HTTPException(401, "Invalid authorization token.")

    try:
        import jwt
        client = _get_jwks_client()
        signing_key = client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256", "ES256"],
            audience="authenticated",
            options={"verify_aud": True},
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401, "Invalid token: missing user id")
        return str(user_id)
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Session expired. Please sign in again.")
    except jwt.InvalidTokenError as e:
        logger.debug(f"JWT verification failed: {e}")
        raise HTTPException(401, "Invalid or expired token. Please sign in again.")


# ============================================================================
# Request/Response Models
# ============================================================================

class ScriptResponse(BaseModel):
    id: int
    name: str
    lines: List[str]
    line_count: int
    created_at: Optional[str] = None

class CreateScriptRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    lines: List[str] = Field(..., min_length=1)

class UpdateScriptRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    lines: List[str] = Field(..., min_length=1)

class RecordingListItem(BaseModel):
    id: int
    script_id: int
    script_name: str
    line_index: int
    recorder_name: str
    phrase_text: str
    text: str  # Alias for phrase_text (kept for compatibility)
    filename: str
    duration_seconds: float
    peak_amplitude: float
    rms_level: float
    is_valid: bool
    storage_path: Optional[str] = None
    created_at: Optional[str] = None

class RecordingProgressResponse(BaseModel):
    script_id: int
    script_name: str
    recorded: int
    total: int
    remaining: int
    percent: int

class SaveRecordingResponse(BaseModel):
    success: bool
    id: Optional[int] = None
    duration_seconds: float = 0
    peak_amplitude: float = 0
    rms_level: float = 0
    is_valid: bool = False
    error: Optional[str] = None


class UserSettings(BaseModel):
    gain: int = Field(100, ge=20, le=200)
    bass: int = Field(0, ge=-12, le=12)
    treble: int = Field(0, ge=-12, le=12)
    device_id: Optional[str] = None


# ============================================================================
# Health Check
# ============================================================================

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": "2.0.0",
        "environment": settings.environment,
    }


# ============================================================================
# TTS Pronunciation (espeak-ng)
# ============================================================================

@app.get("/api/tts/pronounce")
async def tts_pronounce(text: str = "", lang: str = "en"):
    """Synthesize text to speech using espeak-ng. Returns WAV audio."""
    if not text or not text.strip():
        raise HTTPException(400, "Text is required")
    text_clean = text.strip()[:500]
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            out_path = f.name
        try:
            subprocess.run(
                ["espeak-ng", "-w", out_path, "-v", f"{lang}", text_clean],
                check=True,
                capture_output=True,
                timeout=10,
            )
            with open(out_path, "rb") as f:
                audio_data = f.read()
            return Response(
                content=audio_data,
                media_type="audio/wav",
                headers={"Cache-Control": "public, max-age=3600"},
            )
        finally:
            Path(out_path).unlink(missing_ok=True)
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "TTS synthesis timed out")
    except FileNotFoundError:
        logger.warning("espeak-ng not installed, TTS unavailable")
        raise HTTPException(503, "TTS (espeak-ng) is not available")
    except subprocess.CalledProcessError as e:
        logger.error(f"espeak-ng failed: {e}")
        raise HTTPException(500, "TTS synthesis failed")


# ============================================================================
# Scripts Routes
# ============================================================================

@app.get("/api/scripts", response_model=List[ScriptResponse])
async def list_scripts():
    """List all available scripts."""
    try:
        scripts = await db.list_scripts()
        return [
            ScriptResponse(
                id=s["id"],
                name=s["name"],
                lines=s["lines"],
                line_count=s["line_count"],
                created_at=str(s.get("created_at", "")),
            )
            for s in scripts
        ]
    except Exception as e:
        logger.error(f"Failed to list scripts: {e}")
        raise HTTPException(500, f"Failed to list scripts: {e}")


@app.get("/api/scripts/{script_id}", response_model=ScriptResponse)
async def get_script(script_id: int):
    """Get a specific script by ID."""
    try:
        script = await db.get_script(script_id)
        if not script:
            raise HTTPException(404, "Script not found")
        return ScriptResponse(
            id=script["id"],
            name=script["name"],
            lines=script["lines"],
            line_count=script["line_count"],
            created_at=str(script.get("created_at", "")),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get script: {e}")
        raise HTTPException(500, f"Failed to get script: {e}")


# ============================================================================
# Admin Scripts Routes
# ============================================================================

@app.post("/api/admin/scripts", response_model=ScriptResponse)
async def create_script(request_data: CreateScriptRequest, request: Request = None):
    """Create a new script (admin only)."""
    require_admin(request)
    try:
        # Check for duplicate name
        existing = await db.get_script_by_name(request_data.name)
        if existing:
            raise HTTPException(400, f"Script with name '{request_data.name}' already exists")

        script = await db.create_script(request_data.name, request_data.lines)
        return ScriptResponse(
            id=script["id"],
            name=script["name"],
            lines=script["lines"],
            line_count=script["line_count"],
            created_at=str(script.get("created_at", "")),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create script: {e}")
        raise HTTPException(500, f"Failed to create script: {e}")


@app.put("/api/admin/scripts/{script_id}", response_model=ScriptResponse)
async def update_script(script_id: int, request_data: UpdateScriptRequest, request: Request = None):
    """Update a script (admin only)."""
    require_admin(request)
    try:
        script = await db.update_script(script_id, request_data.name, request_data.lines)
        if not script:
            raise HTTPException(404, "Script not found")
        return ScriptResponse(
            id=script["id"],
            name=script["name"],
            lines=script["lines"],
            line_count=script["line_count"],
            created_at=str(script.get("created_at", "")),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update script: {e}")
        raise HTTPException(500, f"Failed to update script: {e}")


@app.delete("/api/admin/scripts/{script_id}")
async def delete_script(script_id: int, request: Request = None):
    """Delete a script and its recordings (admin only)."""
    require_admin(request)
    try:
        success = await db.delete_script(script_id)
        if not success:
            raise HTTPException(404, "Script not found")
        return {"success": True, "message": "Script deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete script: {e}")
        raise HTTPException(500, f"Failed to delete script: {e}")


@app.post("/api/admin/scripts/from-file", response_model=ScriptResponse)
async def create_script_from_file(
    file: UploadFile = File(..., description=".txt file with one phrase per line"),
    name: Optional[str] = Form(None, description="Script name (defaults to filename without .txt)"),
    request: Request = None,
):
    """Create a script from an uploaded .txt file. Each line = one phrase to read.
    Script name defaults to filename (without .txt) if not provided."""
    require_admin(request)
    try:
        if not file.filename or not file.filename.lower().endswith(".txt"):
            raise HTTPException(400, "File must be a .txt file")

        content = (await file.read()).decode("utf-8", errors="replace")
        lines = [line.strip() for line in content.splitlines() if line.strip()]

        if not lines:
            raise HTTPException(400, "File contains no non-empty lines")

        script_name = (name or file.filename).strip()
        if not script_name:
            script_name = file.filename or "unnamed"
        if script_name.lower().endswith(".txt"):
            script_name = script_name[:-4]

        existing = await db.get_script_by_name(script_name)
        if existing:
            raise HTTPException(400, f"Script with name '{script_name}' already exists")

        script = await db.create_script(script_name, lines)
        return ScriptResponse(
            id=script["id"],
            name=script["name"],
            lines=script["lines"],
            line_count=script["line_count"],
            created_at=str(script.get("created_at", "")),
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to create script from file: {e}")
        raise HTTPException(500, f"Failed to create script: {e}")


# ============================================================================
# Recording Routes
# ============================================================================

@app.post("/api/recording/save", response_model=SaveRecordingResponse)
async def save_recording(
    request: Request,
    audio_file: UploadFile = File(...),
    script_id: int = Form(...),
    line_index: int = Form(...),
    phrase_text: str = Form(...),
):
    """Save an uploaded audio recording. User is identified from JWT (Authorization header)."""
    user_id = get_current_user_id(request)
    try:
        # Validate file size
        max_size_bytes = settings.max_upload_size_mb * 1024 * 1024
        audio_data = await audio_file.read()

        if len(audio_data) > max_size_bytes:
            raise HTTPException(413, f"File too large. Maximum size is {settings.max_upload_size_mb}MB")

        if len(audio_data) == 0:
            return SaveRecordingResponse(success=False, error="Empty audio data received")

        if not phrase_text or not phrase_text.strip():
            return SaveRecordingResponse(success=False, error="Phrase text is required")

        # Verify script exists
        script = await db.get_script(script_id)
        if not script:
            raise HTTPException(400, "Script not found")

        if line_index < 0 or line_index >= script["line_count"]:
            raise HTTPException(400, f"Invalid line index {line_index} for script with {script['line_count']} lines")

        # Analyze the WAV data
        audio_info = analyze_wav_bytes(audio_data)

        # Generate filename
        filename = f"{script['name']}_{(line_index + 1):04d}.wav"

        # Save to Supabase (storage + metadata). Use user_id as recorder_name for uniqueness.
        record = await db.save_recording(
            script_id=script_id,
            line_index=line_index,
            phrase_text=phrase_text.strip(),
            recorder_name=user_id,
            filename=filename,
            audio_data=audio_data,
            duration_seconds=audio_info.duration_seconds,
            peak_amplitude=audio_info.peak_amplitude,
            rms_level=audio_info.rms_level,
            is_valid=audio_info.is_valid,
            user_id=user_id,
        )

        logger.info(f"Saved recording: user={user_id} {filename} ({audio_info.duration_seconds:.2f}s)")

        return SaveRecordingResponse(
            success=True,
            id=record.get("id"),
            duration_seconds=audio_info.duration_seconds,
            peak_amplitude=audio_info.peak_amplitude,
            rms_level=audio_info.rms_level,
            is_valid=audio_info.is_valid,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to save recording: {e}")
        return SaveRecordingResponse(success=False, error=str(e))


@app.get("/api/recording/list", response_model=List[RecordingListItem])
async def list_recordings(
    request: Request,
    script_id: Optional[int] = None,
):
    """List recordings for the authenticated user, optionally filtered by script."""
    user_id = get_current_user_id(request)
    try:
        recordings = await db.list_recordings(script_id=script_id, recorder_name=user_id)
        items = []
        for r in recordings:
            script_data = r.get("scripts", {})
            script_name = script_data.get("name", "") if script_data else ""
            phrase_text = r.get("phrase_text", "")

            items.append(RecordingListItem(
                id=r["id"],
                script_id=r["script_id"],
                script_name=script_name,
                line_index=r["line_index"],
                recorder_name=r.get("recorder_name", ""),
                phrase_text=phrase_text,
                text=phrase_text,
                filename=r["filename"],
                duration_seconds=r.get("duration_seconds", 0),
                peak_amplitude=r.get("peak_amplitude", 0),
                rms_level=r.get("rms_level", 0),
                is_valid=r.get("is_valid", True),
                storage_path=r.get("storage_path"),
                created_at=str(r.get("created_at", "")),
            ))
        return items
    except Exception as e:
        logger.error(f"Failed to list recordings: {e}")
        raise HTTPException(500, f"Failed to list recordings: {e}")


@app.get("/api/recording/progress", response_model=List[RecordingProgressResponse])
async def get_recording_progress(request: Request):
    """Get recording progress for the authenticated user."""
    user_id = get_current_user_id(request)
    try:
        progress = await db.get_recording_progress(recorder_name=user_id)
        return [
            RecordingProgressResponse(**p) for p in progress
        ]
    except Exception as e:
        logger.error(f"Failed to get recording progress: {e}")
        raise HTTPException(500, f"Failed to get recording progress: {e}")


@app.get("/api/recordings/{recording_id}/audio")
async def get_recording_audio(recording_id: int, request: Request):
    """Stream recording audio. Requires auth; user must own the recording."""
    user_id = get_current_user_id(request)
    try:
        record = await db.get_recording(recording_id)
        if not record:
            raise HTTPException(404, "Recording not found")
        if str(record.get("user_id")) != user_id:
            raise HTTPException(404, "Recording not found")

        storage_path = record.get("storage_path")
        if not storage_path:
            raise HTTPException(404, "Recording audio not found")

        audio_data = await db.get_recording_audio(storage_path)
        return Response(
            content=audio_data,
            media_type="audio/wav",
            headers={
                "Content-Disposition": f'inline; filename="{record["filename"]}"',
                "Cache-Control": "public, max-age=3600",
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to serve recording audio: {e}")
        raise HTTPException(500, f"Failed to serve audio: {e}")


# ============================================================================
# User Settings Routes
# ============================================================================

@app.get("/api/user/settings", response_model=UserSettings)
async def get_user_settings_route(request: Request):
    """Get per-user audio settings (gain, bass, treble, device)."""
    user_id = get_current_user_id(request)
    try:
        record = await db.get_user_settings(user_id)
        if not record:
            # Defaults if no row yet
            return UserSettings()
        return UserSettings(
            gain=record.get("gain", 100),
            bass=record.get("bass", 0),
            treble=record.get("treble", 0),
            device_id=record.get("device_id"),
        )
    except Exception as e:
        logger.error(f"Failed to get user settings: {e}")
        raise HTTPException(500, f"Failed to get user settings: {e}")


@app.put("/api/user/settings", response_model=UserSettings)
async def update_user_settings_route(request: Request, settings_in: UserSettings):
    """Update per-user audio settings."""
    user_id = get_current_user_id(request)
    try:
        record = await db.upsert_user_settings(
            user_id=user_id,
            gain=settings_in.gain,
            bass=settings_in.bass,
            treble=settings_in.treble,
            device_id=settings_in.device_id,
        )
        return UserSettings(
            gain=record.get("gain", settings_in.gain),
            bass=record.get("bass", settings_in.bass),
            treble=record.get("treble", settings_in.treble),
            device_id=record.get("device_id", settings_in.device_id),
        )
    except Exception as e:
        logger.error(f"Failed to update user settings: {e}")
        raise HTTPException(500, f"Failed to update user settings: {e}")


@app.delete("/api/recordings/{recording_id}")
async def delete_recording_route(recording_id: int, request: Request):
    """Delete a recording owned by the authenticated user."""
    user_id = get_current_user_id(request)
    try:
        record = await db.get_recording(recording_id)
        if not record or str(record.get("user_id")) != user_id:
            raise HTTPException(404, "Recording not found")
        success = await db.delete_recording(recording_id)
        if not success:
            raise HTTPException(404, "Recording not found")
        return {"success": True}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete recording: {e}")
        raise HTTPException(500, f"Failed to delete recording: {e}")


# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.host, port=settings.port)
