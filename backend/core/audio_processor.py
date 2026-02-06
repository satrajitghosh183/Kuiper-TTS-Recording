# Audio Processor Module
# Handles WAV audio analysis from bytes (no filesystem or microphone access)

import io
import wave
import struct
import math
from dataclasses import dataclass
from typing import Optional


@dataclass
class AudioInfo:
    """Information about an audio recording."""

    sample_rate: int
    channels: int
    duration_seconds: float
    samples: int
    bit_depth: int
    peak_amplitude: float
    rms_level: float
    is_valid: bool
    error: Optional[str] = None


# Quality thresholds
MIN_DURATION_SECONDS = 0.5
MAX_DURATION_SECONDS = 30.0
MIN_RMS_LEVEL = 0.01
CLIPPING_THRESHOLD = 0.99


def analyze_wav_bytes(data: bytes) -> AudioInfo:
    """
    Analyze WAV audio data from bytes.

    Args:
        data: Raw WAV file bytes (including header)

    Returns:
        AudioInfo with file properties and quality metrics
    """
    if len(data) < 44:
        return AudioInfo(
            sample_rate=0, channels=0, duration_seconds=0,
            samples=0, bit_depth=0, peak_amplitude=0,
            rms_level=0, is_valid=False,
            error="Audio data too small to be a valid WAV file"
        )

    # Check WAV header
    if data[:4] != b'RIFF' or data[8:12] != b'WAVE':
        return AudioInfo(
            sample_rate=0, channels=0, duration_seconds=0,
            samples=0, bit_depth=0, peak_amplitude=0,
            rms_level=0, is_valid=False,
            error="Not a valid WAV file"
        )

    try:
        with wave.open(io.BytesIO(data), "rb") as wf:
            channels = wf.getnchannels()
            sample_rate = wf.getframerate()
            num_samples = wf.getnframes()
            bit_depth = wf.getsampwidth() * 8
            duration = num_samples / sample_rate if sample_rate > 0 else 0

            frames = wf.readframes(num_samples)
    except Exception as e:
        return AudioInfo(
            sample_rate=0, channels=0, duration_seconds=0,
            samples=0, bit_depth=0, peak_amplitude=0,
            rms_level=0, is_valid=False,
            error=f"Failed to parse WAV: {e}"
        )

    # Calculate peak and RMS from sample data
    peak = 0.0
    rms = 0.0
    total_samples = num_samples * channels

    if bit_depth == 16 and total_samples > 0:
        try:
            format_str = f"<{total_samples}h"
            values = struct.unpack(format_str, frames)
            max_val = 32768.0
            normalized = [v / max_val for v in values]
            peak = max(abs(v) for v in normalized)
            rms = math.sqrt(sum(v ** 2 for v in normalized) / len(normalized))
        except Exception:
            peak = 0.0
            rms = 0.0
    elif bit_depth == 8 and total_samples > 0:
        try:
            format_str = f"<{total_samples}B"
            values = struct.unpack(format_str, frames)
            max_val = 128.0
            normalized = [(v - 128) / max_val for v in values]
            peak = max(abs(v) for v in normalized)
            rms = math.sqrt(sum(v ** 2 for v in normalized) / len(normalized))
        except Exception:
            peak = 0.0
            rms = 0.0

    # Validate
    is_valid = True
    error = None

    if duration < MIN_DURATION_SECONDS:
        is_valid = False
        error = f"Audio too short ({duration:.2f}s)"
    elif duration > MAX_DURATION_SECONDS:
        is_valid = False
        error = f"Audio too long ({duration:.2f}s)"
    elif rms < MIN_RMS_LEVEL:
        is_valid = False
        error = f"Audio too quiet (RMS {rms:.3f})"
    elif peak >= CLIPPING_THRESHOLD:
        is_valid = False
        error = "Audio is clipping"

    return AudioInfo(
        sample_rate=sample_rate,
        channels=channels,
        duration_seconds=round(duration, 3),
        samples=num_samples,
        bit_depth=bit_depth,
        peak_amplitude=round(peak, 4),
        rms_level=round(rms, 4),
        is_valid=is_valid,
        error=error,
    )
