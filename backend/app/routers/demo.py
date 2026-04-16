from fastapi import APIRouter, Query
from typing import Optional

from ..models.schemas import MeasurementResponse, BodyMeasurements
from ..services.style_catalog import apply_style_adjustments, get_style_summary
from ..services.measurement_engine import MeasurementEngine

router = APIRouter(prefix="/api/demo", tags=["demo"])

DEMO_PERSONAS = {
    "male_175": {
        "height_cm": 175,
        "gender": "male",
        "measurements": {
            "shoulder_width_cm": 45.2,
            "chest_circumference_cm": 101.5,
            "sleeve_length_cm": 63.8,
            "shirt_length_cm": 74.5,
            "neck_size_cm": 39.2,
            "waist_cm": 86.4,
        },
        "confidence": 0.92,
        "landmarks": {
            "nose": {"x": 0.50, "y": 0.08, "visibility": 0.99},
            "left_shoulder": {"x": 0.37, "y": 0.22, "visibility": 0.97},
            "right_shoulder": {"x": 0.63, "y": 0.22, "visibility": 0.97},
            "left_elbow": {"x": 0.28, "y": 0.40, "visibility": 0.95},
            "right_elbow": {"x": 0.72, "y": 0.40, "visibility": 0.95},
            "left_wrist": {"x": 0.25, "y": 0.55, "visibility": 0.90},
            "right_wrist": {"x": 0.75, "y": 0.55, "visibility": 0.90},
            "left_hip": {"x": 0.42, "y": 0.53, "visibility": 0.93},
            "right_hip": {"x": 0.58, "y": 0.53, "visibility": 0.93},
            "left_knee": {"x": 0.41, "y": 0.73, "visibility": 0.88},
            "right_knee": {"x": 0.59, "y": 0.73, "visibility": 0.88},
            "left_ankle": {"x": 0.40, "y": 0.93, "visibility": 0.85},
            "right_ankle": {"x": 0.60, "y": 0.93, "visibility": 0.85},
        },
    },
    "female_165": {
        "height_cm": 165,
        "gender": "female",
        "measurements": {
            "shoulder_width_cm": 38.5,
            "chest_circumference_cm": 91.0,
            "sleeve_length_cm": 57.2,
            "shirt_length_cm": 65.0,
            "neck_size_cm": 35.0,
            "waist_cm": 74.8,
        },
        "confidence": 0.91,
        "landmarks": {
            "nose": {"x": 0.50, "y": 0.09, "visibility": 0.99},
            "left_shoulder": {"x": 0.38, "y": 0.23, "visibility": 0.97},
            "right_shoulder": {"x": 0.62, "y": 0.23, "visibility": 0.97},
            "left_elbow": {"x": 0.30, "y": 0.41, "visibility": 0.95},
            "right_elbow": {"x": 0.70, "y": 0.41, "visibility": 0.95},
            "left_wrist": {"x": 0.27, "y": 0.56, "visibility": 0.90},
            "right_wrist": {"x": 0.73, "y": 0.56, "visibility": 0.90},
            "left_hip": {"x": 0.43, "y": 0.54, "visibility": 0.93},
            "right_hip": {"x": 0.57, "y": 0.54, "visibility": 0.93},
            "left_knee": {"x": 0.42, "y": 0.74, "visibility": 0.88},
            "right_knee": {"x": 0.58, "y": 0.74, "visibility": 0.88},
            "left_ankle": {"x": 0.41, "y": 0.94, "visibility": 0.85},
            "right_ankle": {"x": 0.59, "y": 0.94, "visibility": 0.85},
        },
    },
}


@router.get("/personas")
async def list_personas():
    """List available demo personas."""
    return [
        {"id": "male_175", "label": "Male, 175cm, Size M", "gender": "male", "height_cm": 175},
        {"id": "female_165", "label": "Female, 165cm, Size M", "gender": "female", "height_cm": 165},
    ]


@router.get("/{persona}")
async def get_demo(persona: str, style: Optional[str] = Query(None)):
    """Get pre-calculated demo measurements for a persona."""
    data = DEMO_PERSONAS.get(persona)
    if not data:
        return {"error": f"Unknown persona: {persona}. Use 'male_175' or 'female_165'."}

    body_measurements = dict(data["measurements"])
    gender = data["gender"]
    warnings = [f"Demo mode \u2014 sample data for {data['height_cm']}cm {gender}"]

    # Apply style if selected
    if style:
        stitching = apply_style_adjustments(body_measurements, gender, style)
        style_info = get_style_summary(gender, style)
        if style_info:
            warnings.append(f"Style: {style_info['name']} \u2014 {style_info['sleeve_type']} sleeve, {style_info['neck_type']} neck")
    else:
        stitching = body_measurements
        style_info = None

    size = MeasurementEngine.recommend_size(stitching["chest_circumference_cm"], gender)
    inches = MeasurementEngine.cm_to_inches(stitching)

    return MeasurementResponse(
        measurements=BodyMeasurements(**stitching, unit="cm"),
        measurements_inches=inches,
        confidence=data["confidence"],
        recommended_size=size,
        landmarks=data["landmarks"],
        skeleton_image_base64=None,
        warnings=warnings,
        body_measurements=body_measurements,
        style=style_info,
    )
