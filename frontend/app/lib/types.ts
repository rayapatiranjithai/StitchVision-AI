export interface BodyMeasurements {
  shoulder_width_cm: number;
  chest_circumference_cm: number;
  sleeve_length_cm: number;
  shirt_length_cm: number;
  neck_size_cm: number;
  waist_cm: number;
  unit: string;
}

export interface MeasurementResponse {
  measurements: BodyMeasurements;
  measurements_inches: Record<string, number>;
  confidence: number;
  recommended_size: string;
  landmarks: Record<string, LandmarkPoint> | null;
  skeleton_image_base64: string | null;
  warnings: string[];
  body_measurements: Record<string, number> | null;
  style: StyleInfo | null;
}

export interface StyleInfo {
  id: string;
  name: string;
  description: string;
  neck_type: string;
  sleeve_type: string;
  ease: {
    chest_cm: number;
    waist_cm: number;
    shoulder_cm: number;
    neck_cm: number;
  };
  length_factor: number;
  sleeve_factor: number;
  standards: Record<string, Record<string, string>>;
}

export interface LandmarkPoint {
  x: number;
  y: number;
  visibility: number;
}

export interface FrameResponse {
  detected: boolean;
  message?: string;
  measurements?: Record<string, number>;
  confidence?: number;
  landmarks?: Record<string, LandmarkPoint>;
  recommended_size?: string;
}

export interface OllamaStatus {
  status: string;
  model?: string;
  model_available?: boolean;
  available_models?: string[];
  message?: string;
}

// Mapping from cm measurement keys to their inches counterparts
// Both use the same keys (e.g. "shoulder_width_cm" -> value in inches)
export const MEASUREMENT_KEYS = [
  "shoulder_width_cm",
  "chest_circumference_cm",
  "sleeve_length_cm",
  "shirt_length_cm",
  "neck_size_cm",
  "waist_cm",
] as const;

export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];
