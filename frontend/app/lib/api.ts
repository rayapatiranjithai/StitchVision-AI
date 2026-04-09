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
