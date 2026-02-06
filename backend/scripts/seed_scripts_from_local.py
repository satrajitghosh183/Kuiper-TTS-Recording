#!/usr/bin/env python3
"""
Seed Supabase with scripts from local .txt files.
Each line in the file = one phrase to read out.

Usage (from project root):
  python -m backend.scripts.seed_scripts_from_local

Or:
  cd backend && python scripts/seed_scripts_from_local.py

Requires: backend/.env with SUPABASE_URL and SUPABASE_KEY
"""
import asyncio
import os
import sys
from pathlib import Path

# Add backend to path
_project_root = Path(__file__).resolve().parent.parent.parent
_backend_dir = _project_root / "backend"
sys.path.insert(0, str(_backend_dir))

# Load .env from backend/ - try dotenv first, then manual parse
_env_file = _backend_dir / ".env"
if _env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(_env_file, override=True)
    except ImportError:
        pass
    # Fallback: manual parse if dotenv didn't load (e.g. sandbox)
    if not os.environ.get("SUPABASE_URL"):
        try:
            for line in _env_file.read_text().strip().splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, _, val = line.partition("=")
                    key, val = key.strip(), val.strip().strip('"\'')
                    if key:
                        os.environ[key] = val
        except Exception:
            pass

# Script files to import (relative to project root)
SCRIPT_FILES = [
    ("LauraVoice", "LauraVoice.txt"),
    ("phoneme_coverage", "phoneme_coverage.txt"),
]


def load_lines_from_file(filepath: Path) -> list[str]:
    """Load non-empty lines from a text file."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    content = filepath.read_text(encoding="utf-8", errors="replace")
    return [line.strip() for line in content.splitlines() if line.strip()]


async def main():
    if not os.environ.get("SUPABASE_URL") or not os.environ.get("SUPABASE_KEY"):
        print("Error: SUPABASE_URL and SUPABASE_KEY are required.")
        print("Set them in backend/.env or run:")
        print("  SUPABASE_URL=https://xxx.supabase.co SUPABASE_KEY=your-key python -m backend.scripts.seed_scripts_from_local")
        sys.exit(1)

    import db

    print("Seeding scripts from local .txt files...")

    for script_name, filename in SCRIPT_FILES:
        filepath = _project_root / filename
        try:
            lines = load_lines_from_file(filepath)
        except FileNotFoundError as e:
            print(f"  Skipping {filename}: {e}")
            continue

        if not lines:
            print(f"  Skipping {filename}: no lines")
            continue

        try:
            existing = await db.get_script_by_name(script_name)
            if existing:
                print(f"  {script_name}: already exists ({existing['line_count']} lines)")
                continue

            script = await db.create_script(script_name, lines)
            print(f"  {script_name}: created with {len(lines)} lines (id={script['id']})")
        except Exception as e:
            print(f"  {script_name}: error - {e}")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
