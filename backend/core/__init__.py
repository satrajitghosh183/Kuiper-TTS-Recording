# Kuiper TTS Core Module

SAMPLE_RATE = 22050

from .audio_processor import AudioInfo, analyze_wav_bytes

__all__ = [
    "SAMPLE_RATE",
    "AudioInfo",
    "analyze_wav_bytes",
]
