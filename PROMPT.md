# Body Measurement AI - Shirt Stitching Calculator

## Project Overview
Build a production-ready web application that estimates human body measurements for custom shirt stitching using AI-powered computer vision. The system supports both uploaded images and real-time webcam feed.

---

## Architecture

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (React 19, TypeScript, Tailwind CSS 4) |
| Backend | FastAPI (Python 3.13) |
| Pose Detection | MediaPipe PoseLandmarker (Tasks API, heavy model) |
| Image Processing | OpenCV |
| AI Refinement | Ollama (llama3 / mistral) — optional |

### Ports
| Service | Port |
|---------|------|
| Frontend | 3001 |
| Backend API | 8002 |
| Ollama (optional) | 11434 |

---

## Core Features

### 1. Body Measurement Estimation
Detect human body using MediaPipe Pose (33 landmarks) and extract:
- **Shoulder Width** — distance between left and right shoulder landmarks, scaled by depth correction factor
- **Chest Circumference** — estimated from shoulder width using gender-based anthropometric ratios (male: ×2.6, female: ×2.4)
- **Sleeve Length** — shoulder → elbow → wrist distance along the arm with better visibility
- **Shirt Length** — mid-shoulder to hip + 10cm extension
- **Neck Size** — ear-to-ear distance × 0.6 × circumference correction, or fallback from shoulder proportion
- **Waist** — hip width × gender-based ratio (male: ×2.4, female: ×2.2)

### 2. Measurement Pipeline
```
Image Input → MediaPipe PoseLandmarker → 33 Landmarks (pixel coords)
                                              ↓
                                    Scale Factor Calculation
                                    scale = height_cm / pixel_height
                                    pixel_height = nose_to_ankle / 0.88
                                              ↓
                                    Pixel Distance → Real-World cm
                                    measurement_cm = pixel_distance × scale × correction
                                              ↓
                                    (Optional) Ollama LLM Refinement
                                    Cross-check proportions, fix outliers
                                              ↓
                                    Output: Measurements + Size + Confidence
```

### 3. Key Measurement Logic
```python
# Shoulder Width
distance_pixels = distance(left_shoulder, right_shoulder)
scale = real_height_cm / pixel_height
shoulder_cm = distance_pixels * scale * depth_correction

# Chest Estimation (approximation from front view)
chest_circumference = shoulder_width * 2.6  # male average
chest_circumference = shoulder_width * 2.4  # female average

# Sleeve Length
sleeve = (distance(shoulder, elbow) + distance(elbow, wrist)) * scale

# Shirt Length
shirt_length = distance(mid_shoulder, mid_hip) * scale + 10cm

# Neck Size
neck_width = distance(left_ear, right_ear) * scale * 0.6
neck_circumference = neck_width * correction_factor
```

### 4. Input Modes
- **Image Upload** — drag-and-drop or file picker, processes single photo
- **Webcam Capture** — two sub-modes:
  - **Snapshot** — capture a single frame for full analysis with skeleton overlay
  - **Real-time** — process frames every 500ms, live skeleton overlay via SVG, lightweight response (no skeleton image)

### 5. Calibration Step
Before any measurement:
1. User enters height (cm or feet/inches)
2. User selects gender (male/female) for proportion ratios
3. System calculates pixel-to-cm scale factor using full body height

### 6. Output
- Measurements in **cm and inches** (toggle)
- **Shirt size recommendation** (XS → 3XL) based on chest circumference
- **Confidence score** (0-100%) based on landmark visibility
- **Skeleton overlay** image with color-coded measurement lines
- **Warnings** for low-visibility landmarks or estimation fallbacks
- **JSON export** of all measurements

### 7. AI Refinement (Ollama — Optional)
When Ollama is running locally:
- Sends measurements + height + gender to LLM
- LLM validates proportions against human body ratios
- Corrects outliers (>20% deviation capped at ±15%)
- Falls back to original measurements if Ollama is unavailable

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/measure` | Full analysis — image upload, returns measurements + skeleton image |
| `POST` | `/api/measure/frame` | Lightweight — webcam frame, returns measurements + landmarks only |
| `GET` | `/api/ollama/status` | Check Ollama connection and model availability |
| `GET` | `/health` | Backend health check |

### POST /api/measure
**Form Data:**
- `image` (file) — body photo
- `height_cm` (float) — user height in cm
- `gender` (string) — "male" or "female"
- `use_ollama` (bool) — enable AI refinement

**Response:**
```json
{
  "measurements": {
    "shoulder_width_cm": 45.2,
    "chest_circumference_cm": 101.3,
    "sleeve_length_cm": 63.5,
    "shirt_length_cm": 72.8,
    "neck_size_cm": 39.1,
    "waist_cm": 88.4,
    "unit": "cm"
  },
  "measurements_inches": { ... },
  "confidence": 0.87,
  "recommended_size": "L",
  "landmarks": { "nose": {"x": 0.5, "y": 0.1, "visibility": 0.99}, ... },
  "skeleton_image_base64": "...",
  "warnings": []
}
```

---

## Frontend UI Flow

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Body Measurement AI" | API Status | Ollama    │
├───────────┬──────────────────────┬──────────────────────┤
│  Step 1   │  Step 2              │  Step 3              │
│           │                      │                      │
│ Calibrate │  Upload / Webcam     │  Results             │
│ - Height  │  - Drag & drop       │  - Size (XS-3XL)     │
│ - Gender  │  - Camera + capture  │  - Measurements      │
│           │  - Real-time mode    │  - Confidence bar     │
│ AI Toggle │  - Skeleton overlay  │  - cm/in toggle       │
│ (Ollama)  │                      │  - Export JSON        │
│           │                      │  - Warnings           │
├───────────┴──────────────────────┴──────────────────────┤
│  Accuracy Tips: clothing, camera angle, lighting         │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure
```
inch-claculator/
├── backend/
│   ├── .env                          # OLLAMA_BASE_URL, PORT
│   ├── requirements.txt
│   └── app/
│       ├── main.py                   # FastAPI app, CORS, routes
│       ├── models/schemas.py         # Pydantic request/response models
│       ├── routers/measurement.py    # /api/measure, /api/measure/frame, /api/ollama/status
│       └── services/
│           ├── pose_detector.py      # MediaPipe Tasks API wrapper
│           ├── pose_landmarker_heavy.task  # Model file (29MB)
│           ├── measurement_engine.py # Scale calculation, body ratios, size recommendation
│           └── ollama_refiner.py     # LLM-based proportion validation
├── frontend/
│   ├── .env.local                    # NEXT_PUBLIC_API_URL
│   └── app/
│       ├── page.tsx                  # Main 3-column layout
│       ├── layout.tsx                # Root layout + metadata
│       ├── globals.css               # Dark theme + scrollbar
│       ├── lib/
│       │   ├── types.ts              # TypeScript interfaces
│       │   └── api.ts                # Backend API client functions
│       └── components/
│           ├── CalibrationForm.tsx    # Height (cm/ft) + gender input
│           ├── ImageUpload.tsx        # Drag-and-drop file upload
│           ├── WebcamCapture.tsx      # Camera, SVG skeleton overlay, real-time mode
│           ├── MeasurementDisplay.tsx # Results grid, size badge, export button
│           ├── SkeletonOverlay.tsx    # Processed image with skeleton lines
│           └── RealtimeMeasurements.tsx # Live compact measurement display
└── scripts/
    ├── start-backend.sh
    ├── start-frontend.sh
    └── start-all.sh
```

---

## Installation & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- (Optional) Ollama with llama3 or mistral

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # runs on port 3001
```

### Ollama (Optional)
```bash
ollama pull llama3
ollama serve   # runs on port 11434
```

---

## Anthropometric Constants

### Gender-Based Body Ratios
| Ratio | Male | Female |
|-------|------|--------|
| Chest / Shoulder Width | 2.6 | 2.4 |
| Neck Circumference Correction | 1.15 | 1.10 |
| Waist / Hip Width | 2.4 | 2.2 |
| Shoulder Depth Factor | 1.15 | 1.10 |

### Shirt Size Chart (Chest Circumference cm)
| Size | Male | Female |
|------|------|--------|
| XS | 81-86 | 76-82 |
| S | 86-96 | 82-90 |
| M | 96-104 | 90-98 |
| L | 104-112 | 98-108 |
| XL | 112-120 | 108-118 |
| XXL | 120-130 | 118-128 |
| 3XL | 130-145 | — |

### Measurement Clamp Ranges (cm)
| Measurement | Min | Max |
|-------------|-----|-----|
| Shoulder Width | 30 | 65 |
| Chest | 70 | 150 |
| Sleeve Length | 45 | 90 |
| Shirt Length | 55 | 95 |
| Neck | 30 | 55 |
| Waist | 60 | 140 |

---

## Known Limitations & Best Practices

### Accuracy Factors
- **Loose clothing** → inaccurate chest/waist (wear fitted clothes)
- **Camera angle** → distortion (camera at waist height, 2-3m away, front-facing)
- **Lighting** → detection errors (even front lighting, no backlighting)
- **Partial body** → missing landmarks (ensure full body head-to-ankle visible)

### Best Results Checklist
- Stand straight, facing camera directly
- Arms slightly away from body
- Wear form-fitting clothing
- Full body visible in frame (head to feet)
- Good, even lighting
- Camera at waist height, 2-3 meters distance
- Use front + side image if possible

### Technical Constraints
- Works locally (offline except Ollama model download)
- CPU-only inference (no GPU dependency)
- MediaPipe heavy model for best accuracy (~29MB)
- Webcam frames processed every 500ms (not every frame)
- Ollama refinement adds ~2-5s latency per request
