import cv2
import json
import os
import uuid
import numpy as np
import logging
from datetime import datetime
from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from typing import Optional

from ..services.pose_detector import PoseDetector
from ..services.measurement_engine import MeasurementEngine
from ..services.ollama_refiner import refine_measurements, check_ollama_status
from ..services.style_catalog import get_styles_for_gender, get_style_summary, apply_style_adjustments
from ..models.schemas import MeasurementResponse, BodyMeasurements, UserProfile

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["measurements"])

# Single shared PoseDetector — loaded once, used by both router and engine
pose_detector = PoseDetector()
measurement_engine = MeasurementEngine()

# In-memory profile storage (swap for DB in production)
PROFILES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "..", "profiles")
os.makedirs(PROFILES_DIR, exist_ok=True)


def _normalize_landmarks(landmarks: list[dict], dims: dict) -> dict:
    """Convert pixel landmarks to normalized (0-1) coordinates for frontend overlay."""
    key_indices = {
        "nose": PoseDetector.NOSE,
        "left_shoulder": PoseDetector.LEFT_SHOULDER,
        "right_shoulder": PoseDetector.RIGHT_SHOULDER,
        "left_elbow": PoseDetector.LEFT_ELBOW,
        "right_elbow": PoseDetector.RIGHT_ELBOW,
        "left_wrist": PoseDetector.LEFT_WRIST,
        "right_wrist": PoseDetector.RIGHT_WRIST,
        "left_hip": PoseDetector.LEFT_HIP,
        "right_hip": PoseDetector.RIGHT_HIP,
        "left_knee": PoseDetector.LEFT_KNEE,
        "right_knee": PoseDetector.RIGHT_KNEE,
        "left_ankle": PoseDetector.LEFT_ANKLE,
        "right_ankle": PoseDetector.RIGHT_ANKLE,
    }
    result = {}
    for name, idx in key_indices.items():
        lm = landmarks[idx]
        result[name] = {
            "x": lm["x"] / dims["width"],
            "y": lm["y"] / dims["height"],
            "visibility": lm["visibility"],
        }
    return result


@router.post("/measure", response_model=MeasurementResponse)
async def measure_body(
    image: UploadFile = File(...),
    height_cm: float = Form(...),
    gender: Optional[str] = Form("male"),
    style: Optional[str] = Form(None),
    use_ollama: bool = Form(False),
):
    """Process an uploaded image and return body measurements.

    Full analysis with skeleton overlay image, measurements, confidence, and size.
    Optionally applies style-specific ease and length adjustments for stitching.
    """
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image. Please upload a valid image file.")

    detection = pose_detector.detect(img)
    if detection is None:
        raise HTTPException(
            status_code=422,
            detail="No human body detected. Ensure your full body is visible and you are facing the camera.",
        )

    landmarks = detection["landmarks"]

    try:
        result = measurement_engine.calculate_measurements(landmarks, height_cm, gender)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    body_measurements = result["measurements"]
    warnings = result["warnings"]

    # Optionally refine with Ollama
    if use_ollama:
        body_measurements = await refine_measurements(body_measurements, height_cm, gender)
        warnings.append("Measurements refined using AI (Ollama)")

    # Apply style adjustments if a style is selected
    if style:
        stitching_measurements = apply_style_adjustments(body_measurements, gender, style)
        style_info = get_style_summary(gender, style)
        if style_info:
            warnings.append(f"Style: {style_info['name']} — ease applied for {style_info['sleeve_type']} sleeve, {style_info['neck_type']} neck")
    else:
        stitching_measurements = body_measurements

    # Draw skeleton overlay
    skeleton_img = pose_detector.draw_skeleton(img, landmarks)
    skeleton_b64 = pose_detector.image_to_base64(skeleton_img)

    # Recommend size and convert units
    size = measurement_engine.recommend_size(stitching_measurements["chest_circumference_cm"], gender)
    inches = MeasurementEngine.cm_to_inches(stitching_measurements)

    # Normalize landmarks for frontend
    landmark_data = _normalize_landmarks(landmarks, detection["image_dimensions"])

    # Include style standards if applicable
    style_data = get_style_summary(gender, style) if style else None

    logger.info(f"Measurement complete: style={style}, size={size}, confidence={result['confidence']}")

    response = MeasurementResponse(
        measurements=BodyMeasurements(**stitching_measurements, unit="cm"),
        measurements_inches=inches,
        confidence=result["confidence"],
        recommended_size=size,
        landmarks=landmark_data,
        skeleton_image_base64=skeleton_b64,
        warnings=warnings,
        body_measurements=body_measurements,
        style=style_data,
    )
    return response


@router.post("/measure/frame")
async def measure_frame(
    image: UploadFile = File(...),
    height_cm: float = Form(...),
    gender: Optional[str] = Form("male"),
):
    """Lightweight endpoint for real-time webcam frame processing.

    Returns measurements and landmarks without skeleton image for speed.
    """
    contents = await image.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return {"detected": False, "message": "Invalid image data"}

    detection = pose_detector.detect(img)
    if detection is None:
        return {"detected": False, "message": "No body detected"}

    landmarks = detection["landmarks"]

    try:
        result = measurement_engine.calculate_measurements(landmarks, height_cm, gender)
    except ValueError:
        return {"detected": False, "message": "Cannot calculate measurements - ensure full body is visible"}

    norm_landmarks = _normalize_landmarks(landmarks, detection["image_dimensions"])

    return {
        "detected": True,
        "measurements": result["measurements"],
        "confidence": result["confidence"],
        "landmarks": norm_landmarks,
        "recommended_size": measurement_engine.recommend_size(
            result["measurements"]["chest_circumference_cm"], gender
        ),
    }


# --- Style Endpoints ---

@router.get("/styles/{gender}")
async def list_styles(gender: str):
    """List all available stitching styles for a gender."""
    styles = get_styles_for_gender(gender)
    return [
        get_style_summary(gender, style_id)
        for style_id in styles
    ]


@router.get("/styles/{gender}/{style_id}")
async def get_style_detail(gender: str, style_id: str):
    """Get detailed information about a specific style."""
    style = get_style_summary(gender, style_id)
    if not style:
        raise HTTPException(status_code=404, detail=f"Style '{style_id}' not found for {gender}")
    return style


@router.get("/ollama/status")
async def ollama_status():
    """Check Ollama connection status and model availability."""
    return await check_ollama_status()


# --- User Profile Endpoints ---

@router.post("/profiles")
async def save_profile(profile: UserProfile):
    """Save a user measurement profile."""
    profile.id = profile.id or str(uuid.uuid4())[:8]
    profile.created_at = datetime.now().isoformat()

    filepath = os.path.join(PROFILES_DIR, f"{profile.id}.json")
    with open(filepath, "w") as f:
        json.dump(profile.model_dump(), f, indent=2)

    logger.info(f"Profile saved: {profile.id} ({profile.name})")
    return profile


@router.get("/profiles")
async def list_profiles():
    """List all saved measurement profiles."""
    profiles = []
    for filename in os.listdir(PROFILES_DIR):
        if filename.endswith(".json"):
            with open(os.path.join(PROFILES_DIR, filename)) as f:
                profiles.append(json.load(f))
    return sorted(profiles, key=lambda p: p.get("created_at", ""), reverse=True)


@router.get("/profiles/{profile_id}")
async def get_profile(profile_id: str):
    """Get a specific profile by ID."""
    filepath = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Profile not found")
    with open(filepath) as f:
        return json.load(f)


@router.delete("/profiles/{profile_id}")
async def delete_profile(profile_id: str):
    """Delete a profile."""
    filepath = os.path.join(PROFILES_DIR, f"{profile_id}.json")
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Profile not found")
    os.remove(filepath)
    return {"deleted": True, "id": profile_id}
