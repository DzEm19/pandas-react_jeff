import base64
import os
import tempfile
from pathlib import Path

import httpx
from deepface import DeepFace
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import Client, create_client


SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL") or os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
supabase: Client | None = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None

app = FastAPI(title="Pandas DeepFace API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ARCFACE_DISTANCE_THRESHOLD = 0.68


class RecognitionRequest(BaseModel):
    image: str


def decode_image(image_data: str) -> bytes:
    try:
        encoded_image = image_data.split(",", 1)[-1]
        return base64.b64decode(encoded_image)
    except (ValueError, base64.binascii.Error) as error:
        raise HTTPException(status_code=400, detail="La imagen recibida no es válida.") from error


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok", "engine": "DeepFace"}


@app.post("/api/recognize")
async def recognize(request: RecognitionRequest) -> dict:
    if supabase is None:
        raise HTTPException(status_code=500, detail="Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el backend.")

    image_bytes = decode_image(request.image)
    with tempfile.TemporaryDirectory() as temp_dir:
        query_path = Path(temp_dir) / "query.jpg"
        query_path.write_bytes(image_bytes)
        try:
            records = supabase.table("face_records").select(
                "id, first_name, last_name, age, dni, phone, label, image_url, image_path, created_at"
            ).eq("label", "persona autorizada").execute().data or []
        except Exception as error:
            raise HTTPException(status_code=500, detail="No se pudieron consultar los registros faciales.") from error

        best_distance: float | None = None
        best_record: dict | None = None
        for record in records:
            try:
                reference_path = Path(temp_dir) / f"{record['id']}.jpg"
                async with httpx.AsyncClient(timeout=15) as client:
                    response = await client.get(record["image_url"])
                    response.raise_for_status()
                reference_path.write_bytes(response.content)
                result = DeepFace.verify(
                    img1_path=str(query_path),
                    img2_path=str(reference_path),
                    model_name="ArcFace",
                    detector_backend="opencv",
                    enforce_detection=True,
                )
                distance = float(result.get("distance", 1.0))
                if best_distance is None or distance < best_distance:
                    best_distance = distance
                    best_record = record
            except Exception:
                continue

    if best_distance is None:
        return {"authorized": False, "authorized_probability": 0, "unauthorized_probability": 100, "record": None}

    authorized_probability = max(0.0, min(100.0, (1 - best_distance / ARCFACE_DISTANCE_THRESHOLD) * 100))
    authorized = authorized_probability >= 50 and best_record is not None
    return {
        "authorized": authorized,
        "authorized_probability": round(authorized_probability, 1),
        "unauthorized_probability": round(100 - authorized_probability, 1),
        "record": best_record if authorized else None,
    }