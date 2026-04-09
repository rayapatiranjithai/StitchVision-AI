from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MeasurementRequest(BaseModel):
    height_cm: float = Field(..., gt=100, lt=250, description="User height in centimeters")
    gender: Optional[str] = Field("male", pattern="^(male|female)$")
    use_ollama: bool = Field(False, description="Whether to refine measurements using Ollama LLM")


class Landmark(BaseModel):
    x: float
    y: float
    z: float
    visibility: float


class BodyMeasurements(BaseModel):
    shoulder_width_cm: float
    chest_circumference_cm: float
    sleeve_length_cm: float
    shirt_length_cm: float
    neck_size_cm: float
    waist_cm: float
    unit: str = "cm"


class MeasurementResponse(BaseModel):
    measurements: BodyMeasurements
    measurements_inches: dict
    confidence: float
    recommended_size: str
    landmarks: Optional[dict] = None
    skeleton_image_base64: Optional[str] = None
    warnings: list[str] = []
    body_measurements: Optional[dict] = None  # raw body measurements before style ease
    style: Optional[dict] = None              # style details + standards if selected


class UserProfile(BaseModel):
    id: Optional[str] = None
    name: str
    height_cm: float
    gender: str = "male"
    measurements: Optional[BodyMeasurements] = None
    recommended_size: Optional[str] = None
    created_at: Optional[str] = None
