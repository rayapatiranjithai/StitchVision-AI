# StitchVision AI

AI-powered body measurement estimation for custom shirt stitching using computer vision.

Upload a photo or use your webcam to get accurate body measurements for tailoring — with style-specific ease adjustments, 3D garment preview, and shirt size recommendations.

## Features

- **Pose Detection** — MediaPipe PoseLandmarker (33 body landmarks)
- **6 Body Measurements** — Shoulder, Chest, Sleeve, Length, Neck, Waist
- **12 Stitching Styles** — Regular Fit, Slim Fit, Kurta, Nehru, Polo, Blouse, Kurti, Anarkali, Peplum, A-Line, and more
- **Real-time Webcam** — Live skeleton overlay with measurements every 500ms
- **Garment Preview** — Realistic SVG illustration scaled to your measurements
- **Size Recommendation** — XS to 3XL based on chest circumference
- **AI Refinement** — Optional Ollama LLM cross-checks body proportions
- **Export** — Download measurements as JSON
- **Offline** — Works locally without internet

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | FastAPI, Python 3.13, Pydantic |
| AI/CV | MediaPipe PoseLandmarker, OpenCV, NumPy |
| LLM (optional) | Ollama (llama3 / mistral) |

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```
> The 29MB pose model auto-downloads on first run.

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3001**

### Ollama (Optional)
```bash
ollama pull llama3
ollama serve
```

## How It Works

```
Photo/Webcam → MediaPipe Pose (33 landmarks)
    → Scale: height_cm / (nose_to_ankle_px / 0.88)
    → Measurements = pixel_distance × scale × correction
    → Style ease applied (e.g. +12cm chest for Regular Fit)
    → Output: Measurements + Size + Garment Preview
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py                    # FastAPI app
│   │   ├── models/schemas.py          # Pydantic models
│   │   ├── routers/measurement.py     # API endpoints
│   │   └── services/
│   │       ├── pose_detector.py       # MediaPipe wrapper
│   │       ├── measurement_engine.py  # Body → cm conversion
│   │       ├── style_catalog.py       # 12 stitching styles
│   │       └── ollama_refiner.py      # LLM refinement
│   └── requirements.txt
├── frontend/
│   └── app/
│       ├── page.tsx                   # Main app
│       ├── lib/                       # API client + types
│       └── components/
│           ├── CalibrationForm.tsx     # Height + gender input
│           ├── StyleSelector.tsx       # Stitching style picker
│           ├── ImageUpload.tsx         # Drag-and-drop upload
│           ├── WebcamCapture.tsx       # Camera + live overlay
│           ├── MeasurementDisplay.tsx  # Results + export
│           ├── GarmentPreview3D.tsx    # SVG garment illustration
│           └── ...
└── scripts/                           # Startup scripts
```

## License

MIT
