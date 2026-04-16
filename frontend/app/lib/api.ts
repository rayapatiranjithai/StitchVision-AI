const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8002";

export async function measureImage(
  file: File | Blob,
  heightCm: number,
  gender: string,
  useOllama: boolean,
  style?: string
) {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("height_cm", heightCm.toString());
  formData.append("gender", gender);
  formData.append("use_ollama", useOllama.toString());
  if (style) formData.append("style", style);

  const res = await fetch(`${API_BASE}/api/measure`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function measureFrame(
  blob: Blob,
  heightCm: number,
  gender: string
) {
  const formData = new FormData();
  formData.append("image", blob, "frame.jpg");
  formData.append("height_cm", heightCm.toString());
  formData.append("gender", gender);

  const res = await fetch(`${API_BASE}/api/measure/frame`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) return null;
  return res.json();
}

export async function checkOllamaStatus() {
  try {
    const res = await fetch(`${API_BASE}/api/ollama/status`);
    return res.json();
  } catch {
    return { status: "disconnected", message: "Cannot reach backend" };
  }
}

export async function checkHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// --- Demo APIs ---

// Embedded fallback so demo works even without backend
const DEMO_FALLBACK: Record<string, Record<string, unknown>> = {
  male_175: {
    measurements: { shoulder_width_cm: 45.2, chest_circumference_cm: 101.5, sleeve_length_cm: 63.8, shirt_length_cm: 74.5, neck_size_cm: 39.2, waist_cm: 86.4, unit: "cm" },
    measurements_inches: { shoulder_width_cm: 17.8, chest_circumference_cm: 40.0, sleeve_length_cm: 25.1, shirt_length_cm: 29.3, neck_size_cm: 15.4, waist_cm: 34.0 },
    confidence: 0.92, recommended_size: "M",
    body_measurements: { shoulder_width_cm: 45.2, chest_circumference_cm: 101.5, sleeve_length_cm: 63.8, shirt_length_cm: 74.5, neck_size_cm: 39.2, waist_cm: 86.4 },
    landmarks: { nose: { x: 0.50, y: 0.08, visibility: 0.99 }, left_shoulder: { x: 0.37, y: 0.22, visibility: 0.97 }, right_shoulder: { x: 0.63, y: 0.22, visibility: 0.97 }, left_elbow: { x: 0.28, y: 0.40, visibility: 0.95 }, right_elbow: { x: 0.72, y: 0.40, visibility: 0.95 }, left_wrist: { x: 0.25, y: 0.55, visibility: 0.90 }, right_wrist: { x: 0.75, y: 0.55, visibility: 0.90 }, left_hip: { x: 0.42, y: 0.53, visibility: 0.93 }, right_hip: { x: 0.58, y: 0.53, visibility: 0.93 }, left_knee: { x: 0.41, y: 0.73, visibility: 0.88 }, right_knee: { x: 0.59, y: 0.73, visibility: 0.88 }, left_ankle: { x: 0.40, y: 0.93, visibility: 0.85 }, right_ankle: { x: 0.60, y: 0.93, visibility: 0.85 } },
    skeleton_image_base64: null,
    style: { id: "regular_fit_shirt", name: "Regular Fit Shirt", description: "Classic business/casual shirt", neck_type: "collar", sleeve_type: "full", ease: { chest_cm: 12, waist_cm: 14, shoulder_cm: 2, neck_cm: 1.5 }, length_factor: 1.0, sleeve_factor: 1.0, standards: {} },
    warnings: ["Demo mode \u2014 sample data for 175cm male"],
  },
  female_165: {
    measurements: { shoulder_width_cm: 38.5, chest_circumference_cm: 91.0, sleeve_length_cm: 57.2, shirt_length_cm: 65.0, neck_size_cm: 35.0, waist_cm: 74.8, unit: "cm" },
    measurements_inches: { shoulder_width_cm: 15.2, chest_circumference_cm: 35.8, sleeve_length_cm: 22.5, shirt_length_cm: 25.6, neck_size_cm: 13.8, waist_cm: 29.4 },
    confidence: 0.91, recommended_size: "M",
    body_measurements: { shoulder_width_cm: 38.5, chest_circumference_cm: 91.0, sleeve_length_cm: 57.2, shirt_length_cm: 65.0, neck_size_cm: 35.0, waist_cm: 74.8 },
    landmarks: { nose: { x: 0.50, y: 0.09, visibility: 0.99 }, left_shoulder: { x: 0.38, y: 0.23, visibility: 0.97 }, right_shoulder: { x: 0.62, y: 0.23, visibility: 0.97 }, left_elbow: { x: 0.30, y: 0.41, visibility: 0.95 }, right_elbow: { x: 0.70, y: 0.41, visibility: 0.95 }, left_wrist: { x: 0.27, y: 0.56, visibility: 0.90 }, right_wrist: { x: 0.73, y: 0.56, visibility: 0.90 }, left_hip: { x: 0.43, y: 0.54, visibility: 0.93 }, right_hip: { x: 0.57, y: 0.54, visibility: 0.93 }, left_knee: { x: 0.42, y: 0.74, visibility: 0.88 }, right_knee: { x: 0.58, y: 0.74, visibility: 0.88 }, left_ankle: { x: 0.41, y: 0.94, visibility: 0.85 }, right_ankle: { x: 0.59, y: 0.94, visibility: 0.85 } },
    skeleton_image_base64: null,
    style: { id: "classic_blouse", name: "Classic Blouse", description: "Standard fitted blouse with darts", neck_type: "collar", sleeve_type: "full", ease: { chest_cm: 10, waist_cm: 10, shoulder_cm: 1.5, neck_cm: 1 }, length_factor: 0.95, sleeve_factor: 1.0, standards: {} },
    warnings: ["Demo mode \u2014 sample data for 165cm female"],
  },
};

export async function fetchDemoResult(persona: string, style?: string) {
  try {
    const params = style ? `?style=${style}` : "";
    const res = await fetch(`${API_BASE}/api/demo/${persona}${params}`);
    if (res.ok) return res.json();
  } catch { /* fall through */ }
  // Fallback to embedded data
  return DEMO_FALLBACK[persona] || DEMO_FALLBACK.male_175;
}

// --- Style APIs ---

export async function fetchStyles(gender: string) {
  try {
    const res = await fetch(`${API_BASE}/api/styles/${gender}`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// --- Profile APIs ---

export interface ProfileData {
  id?: string;
  name: string;
  height_cm: number;
  gender: string;
  measurements?: Record<string, unknown>;
  recommended_size?: string;
  created_at?: string;
}

export async function saveProfile(profile: ProfileData) {
  const res = await fetch(`${API_BASE}/api/profiles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) throw new Error("Failed to save profile");
  return res.json();
}

export async function listProfiles(): Promise<ProfileData[]> {
  try {
    const res = await fetch(`${API_BASE}/api/profiles`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function deleteProfile(id: string) {
  const res = await fetch(`${API_BASE}/api/profiles/${id}`, { method: "DELETE" });
  return res.ok;
}
