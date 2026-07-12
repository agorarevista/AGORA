import asyncio
import os
import tempfile
from pathlib import Path
from typing import Literal

import edge_tts
from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from mutagen.mp3 import MP3
from pydantic import BaseModel, Field


app = FastAPI(
    title="Agorá TTS Service",
    version="1.0.0",
)


VOICE_MAP = {
    "male": "es-MX-JorgeNeural",
    "female": "es-MX-DaliaNeural",
}


class SpeechRequest(BaseModel):
    text: str = Field(
        min_length=1,
        max_length=100000,
    )

    voice: Literal["male", "female"]

    rate: str = "-4%"

    pitch: str = "+0Hz"

    volume: str = "+0%"


def verify_internal_secret(
    provided_secret: str | None,
) -> None:
    expected_secret = os.getenv("TTS_INTERNAL_SECRET")

    if not expected_secret:
        raise HTTPException(
            status_code=500,
            detail="TTS_INTERNAL_SECRET no está configurado.",
        )

    if provided_secret != expected_secret:
        raise HTTPException(
            status_code=401,
            detail="Acceso no autorizado.",
        )


@app.get("/")
async def root():
    return {
        "service": "agora-tts",
        "status": "ok",
        "voices": VOICE_MAP,
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
    }


@app.post("/generate")
async def generate_speech(
    payload: SpeechRequest,
    x_internal_secret: str | None = Header(
        default=None,
        alias="X-Internal-Secret",
    ),
):
    verify_internal_secret(x_internal_secret)

    clean_text = payload.text.strip()

    if not clean_text:
        raise HTTPException(
            status_code=400,
            detail="El texto está vacío.",
        )

    selected_voice = VOICE_MAP[payload.voice]

    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            suffix=".mp3",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)

        communicate = edge_tts.Communicate(
            text=clean_text,
            voice=selected_voice,
            rate=payload.rate,
            pitch=payload.pitch,
            volume=payload.volume,
        )

        await communicate.save(str(temporary_path))

        audio_bytes = temporary_path.read_bytes()

        if not audio_bytes:
            raise RuntimeError(
                "Microsoft Edge no devolvió audio."
            )

        mp3_metadata = MP3(str(temporary_path))

        duration_seconds = max(
            1,
            round(mp3_metadata.info.length),
        )

        return Response(
            content=audio_bytes,
            media_type="audio/mpeg",
            headers={
                "X-Audio-Duration": str(duration_seconds),
                "X-Audio-Voice": selected_voice,
                "Content-Disposition": (
                    f'inline; filename="agora-{payload.voice}.mp3"'
                ),
            },
        )

    except asyncio.CancelledError:
        raise

    except Exception as error:
        print(
            "Error generando audio:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "No fue posible generar la narración."
            ),
        ) from error

    finally:
        if (
            temporary_path
            and temporary_path.exists()
        ):
            temporary_path.unlink(
                missing_ok=True
            )