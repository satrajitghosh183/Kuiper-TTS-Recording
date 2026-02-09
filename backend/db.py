# Supabase Database Layer
# Manages connection to Supabase for scripts and recordings

import logging
from typing import Optional, List, Dict, Any
from supabase import create_client, Client
from core.config import get_settings

logger = logging.getLogger('kuiper.db')

_client: Optional[Client] = None


def get_supabase() -> Client:
    """Get the Supabase client singleton."""
    global _client
    if _client is None:
        settings = get_settings()
        _client = create_client(settings.supabase_url, settings.supabase_key)
    return _client


# ============================================================================
# Scripts
# ============================================================================

async def list_scripts() -> List[Dict[str, Any]]:
    """List all scripts ordered by name."""
    client = get_supabase()
    result = client.table("scripts").select("*").order("name").execute()
    return result.data


async def get_script(script_id: int) -> Optional[Dict[str, Any]]:
    """Get a script by ID."""
    client = get_supabase()
    result = client.table("scripts").select("*").eq("id", script_id).execute()
    return result.data[0] if result.data else None


async def get_script_by_name(name: str) -> Optional[Dict[str, Any]]:
    """Get a script by name."""
    client = get_supabase()
    result = client.table("scripts").select("*").eq("name", name).execute()
    return result.data[0] if result.data else None


async def create_script(name: str, lines: List[str]) -> Dict[str, Any]:
    """Create a new script."""
    client = get_supabase()
    result = client.table("scripts").insert({
        "name": name,
        "lines": lines,
        "line_count": len(lines),
    }).execute()
    return result.data[0]


async def update_script(script_id: int, name: str, lines: List[str]) -> Optional[Dict[str, Any]]:
    """Update an existing script."""
    client = get_supabase()
    result = client.table("scripts").update({
        "name": name,
        "lines": lines,
        "line_count": len(lines),
    }).eq("id", script_id).execute()
    return result.data[0] if result.data else None


async def delete_script(script_id: int) -> bool:
    """Delete a script and its recordings."""
    client = get_supabase()
    # Delete associated recordings first (storage files)
    recordings = client.table("recordings").select("storage_path").eq("script_id", script_id).execute()
    if recordings.data:
        paths = [r["storage_path"] for r in recordings.data if r.get("storage_path")]
        if paths:
            try:
                client.storage.from_("recordings").remove(paths)
            except Exception as e:
                logger.warning(f"Failed to delete storage files: {e}")

    # Delete recordings from DB
    client.table("recordings").delete().eq("script_id", script_id).execute()
    # Delete script
    result = client.table("scripts").delete().eq("id", script_id).execute()
    return len(result.data) > 0


# ============================================================================
# Recordings
# ============================================================================

def _sanitize_recorder_name(name: str) -> str:
    """Sanitize recorder name for use in storage paths (no spaces, special chars)."""
    import re
    return re.sub(r'[^\w\-]', '_', name.strip())[:100] or "unknown"


async def save_recording(
    script_id: int,
    line_index: int,
    phrase_text: str,
    recorder_name: str,
    filename: str,
    audio_data: bytes,
    duration_seconds: float = 0,
    peak_amplitude: float = 0,
    rms_level: float = 0,
    is_valid: bool = True,
    user_id: Optional[str] = None,
) -> Dict[str, Any]:
    """Save a recording. Uploads audio to Supabase Storage, metadata to DB.
    Uses upsert to allow re-recording the same line by the same recorder.
    Storage path: recordings/{recorder_name}/{script_id}/{filename}
    """
    client = get_supabase()
    safe_name = _sanitize_recorder_name(recorder_name)
    storage_path = f"{safe_name}/{script_id}/{filename}"

    # Upload audio to Supabase Storage
    try:
        # Remove existing file if re-recording
        try:
            client.storage.from_("recordings").remove([storage_path])
        except Exception:
            pass

        client.storage.from_("recordings").upload(
            storage_path,
            audio_data,
            file_options={"content-type": "audio/wav", "upsert": "true"},
        )
    except Exception as e:
        logger.error(f"Failed to upload audio to storage: {e}")
        raise

    # Upsert metadata in DB
    record = {
        "script_id": script_id,
        "line_index": line_index,
        "phrase_text": phrase_text,
        "recorder_name": recorder_name.strip(),
        "filename": filename,
        "storage_path": storage_path,
        "duration_seconds": duration_seconds,
        "peak_amplitude": peak_amplitude,
        "rms_level": rms_level,
        "is_valid": is_valid,
        "file_size_bytes": len(audio_data),
    }
    if user_id:
        record["user_id"] = user_id

    result = client.table("recordings").upsert(
        record,
        on_conflict="script_id,line_index,recorder_name",
    ).execute()

    return result.data[0]


async def list_recordings(
    script_id: Optional[int] = None,
    recorder_name: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """List recordings, optionally filtered by script and/or recorder name."""
    client = get_supabase()
    query = client.table("recordings").select("*, scripts(name, lines)")
    if script_id is not None:
        query = query.eq("script_id", script_id)
    if recorder_name is not None:
        query = query.eq("recorder_name", recorder_name.strip())
    result = query.order("script_id").order("line_index").execute()
    return result.data


async def get_recording(recording_id: int) -> Optional[Dict[str, Any]]:
    """Get a recording by ID."""
    client = get_supabase()
    result = client.table("recordings").select("*, scripts(name, lines)").eq("id", recording_id).execute()
    return result.data[0] if result.data else None


async def get_recording_audio(storage_path: str) -> bytes:
    """Download recording audio from Supabase Storage."""
    client = get_supabase()
    return client.storage.from_("recordings").download(storage_path)


async def get_recording_progress(recorder_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get recording progress per script, optionally filtered by recorder name."""
    client = get_supabase()
    scripts = await list_scripts()

    progress = []
    for script in scripts:
        query = client.table("recordings").select("id", count="exact").eq("script_id", script["id"])
        if recorder_name is not None:
            query = query.eq("recorder_name", recorder_name.strip())
        result = query.execute()
        recorded = result.count or 0
        total = script["line_count"]
        percent = round((recorded / total * 100), 1) if total > 0 else 0
        progress.append({
            "script_id": script["id"],
            "script_name": script["name"],
            "recorded": recorded,
            "total": total,
            "remaining": total - recorded,
            "percent": percent,
        })

    return progress


async def delete_recording(recording_id: int) -> bool:
    """Delete a recording from storage and database."""
    client = get_supabase()
    record = await get_recording(recording_id)
    if not record:
        return False

    storage_path = record.get("storage_path")
    if storage_path:
        try:
            client.storage.from_("recordings").remove([storage_path])
            logger.info(f"Deleted storage file: {storage_path}")
        except Exception as e:
            logger.warning(f"Failed to delete from storage {storage_path}: {e}")
            # Continue to delete DB row - orphaned file is better than orphaned row

    result = client.table("recordings").delete().eq("id", recording_id).execute()
    deleted_count = len(result.data) if result.data is not None else 0
    if deleted_count == 0:
        logger.warning(f"Delete recording {recording_id}: no rows affected (RLS or missing row?)")
        return False
    return True


# ============================================================================
# User Settings
# ============================================================================

async def get_user_settings(user_id: str) -> Optional[Dict[str, Any]]:
    """Fetch per-user audio settings."""
    client = get_supabase()
    result = client.table("user_settings").select("*").eq("user_id", user_id).execute()
    return result.data[0] if result.data else None


async def upsert_user_settings(
    user_id: str,
    gain: int,
    bass: int,
    treble: int,
    device_id: Optional[str],
) -> Dict[str, Any]:
    """Create or update per-user audio settings."""
    client = get_supabase()
    record: Dict[str, Any] = {
        "user_id": user_id,
        "gain": gain,
        "bass": bass,
        "treble": treble,
        "device_id": device_id,
    }
    result = client.table("user_settings").upsert(
        record,
        on_conflict="user_id",
    ).execute()
    return result.data[0]
