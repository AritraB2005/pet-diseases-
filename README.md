# Pet Disease Analyzer (Full-Stack Multimodal AI System)

An AI-powered veterinary triage and disease prediction platform combining clinical tabular machine learning (**XGBoost**) and cutaneous deep learning (**PyTorch MobileNetV3**). Built with **FastAPI (Python)** on the backend and **React (Vite + Tailwind CSS)** on the frontend, featuring an independent, production-ready **Mobile REST API**.

---

## 🌟 Key Features

### 1. Modern Veterinary User Interface
- **Pet-Friendly Palette**: Soft teal, warm white, slate gray, with urgency indicators (emerald, amber, rose).
- **Pet Profile Selector**: Species toggle (Canine / Feline), breed autocomplete, age (months/years), and body weight (kg/lbs).
- **Dual-Mode Diagnostic Inputs**:
  - **Symptom Selector**: Multi-select searchable chips categorized into *Digestive*, *Skin & Coat*, *Respiratory*, and *Behavioral & Systemic*.
  - **Clinical Severity Slider**: 3-step reactive slider (*Mild*, *Moderate*, *Severe*) and duration stepper.
  - **Image Uploader**: Drag-and-drop zone for photographing cutaneous lesions, rash, or ocular discharge with live preview and built-in synthetic clinical presets.
- **Results Dashboard**:
  - Top 3 differential diagnoses ranked by calibrated probability.
  - Confidence score progress bars.
  - Urgency Badges: **High / Emergency Care Required**, **Moderate / Schedule Vet Visit**, **Low / Monitor at Home**.
  - Clinical reasoning ("Why these symptoms match") tailored to pet age, species, and breed.
  - Actionable vet-approved next steps and print/PDF export.
- **Persistent Veterinary Medical Disclaimer**: Prominently displayed across all views.

---

## 📱 Independent Mobile API (v1)

Designed specifically for native mobile applications (iOS Swift, Android Kotlin, and Flutter/React Native) with compact payloads and offline-friendly triage support.

### Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/mobile/analyze` | High-efficiency triage endpoint returning emergency flags, top conditions, and action steps |
| `GET` | `/api/v1/mobile/symptoms` | Dynamic taxonomy tree (categories, chip IDs, descriptions, and icon hints) |
| `GET` | `/api/v1/mobile/breeds` | Curated canine & feline breed arrays for mobile autocomplete pickers |
| `GET` | `/api/v1/mobile/health` | Lightweight ping to check server readiness and model availability |
| `GET` | `/docs` | Interactive OpenAPI / Swagger specification |

#### Sample Request (`POST /api/v1/mobile/analyze`):
```json
{
  "pet_profile": {
    "species": "Dog",
    "breed": "German Shepherd",
    "age_months": 4.0,
    "weight_kg": 7.5
  },
  "symptoms": ["vomiting", "diarrhea", "bloody_stool", "extreme_lethargy"],
  "severity": "Severe",
  "duration_days": 2,
  "image_base64": null
}
```

#### Sample Response:
```json
{
  "success": true,
  "is_emergency": true,
  "urgency_tier": "High",
  "urgency_badge": "High / Emergency Care Required",
  "top_conditions": [
    {
      "name": "Canine Parvovirus",
      "confidence": 99.0,
      "urgency": "High",
      "urgency_badge": "High / Emergency Care",
      "rationale": "In this 4 month old Dog (German Shepherd), marked by acute bloody diarrhea, persistent vomiting, severe dehydration, and extreme lethargy...",
      "action_items": [
        "Seek IMMEDIATE emergency veterinary intensive care within hours.",
        "Do NOT attempt home treatment; intravenous fluid therapy is lifesaving."
      ],
      "symptom_confidence": 99.0,
      "visual_confidence": null
    }
  ],
  "visual_findings": [],
  "disclaimer": "CRITICAL VETERINARY MEDICAL DISCLAIMER..."
}
```

---

## 🧠 Machine Learning Architecture (`/backend/ml`)

1. **Tabular Clinical Classifier (`train_symptom_model.py`)**:
   - Generates 5,000 clinically coherent multi-feature patient profiles across 10 major conditions (Canine Parvovirus, Feline Upper Respiratory Infection, Allergic Dermatitis, Otitis Externa, Acute Gastroenteritis, Canine Tick Fever, Ringworm, Mange, Flea Allergy Dermatitis, Conjunctivitis).
   - Trains an **XGBoost multi-class classifier** yielding **~88% accuracy**.
   - Serializes `symptom_model.joblib`, `label_encoder.joblib`, and `metadata.json`.

2. **Dermatological Vision Pipeline (`image_analyzer.py`)**:
   - Built around a **PyTorch MobileNetV3-Small** architecture referencing Kaggle pet disease and dog skin disease datasets.
   - Extracts cutaneous biomarkers:
     - **Erythema Index**: Redness and inflammatory vascular dilation metric.
     - **Texture Roughness**: High-frequency gradient analysis detecting scabs, scaling, and hyperkeratosis.
     - **Alopecia & Lesion Symmetry**: Circular baldness and periorbital/aural swelling patterns.

---

## 🚀 Running Locally

### Backend (FastAPI):
```bash
cd backend
# Using uv or virtual environment:
uv venv
uv pip install fastapi uvicorn pydantic python-multipart scikit-learn xgboost joblib numpy pillow torch torchvision

# Train model (if not already generated)
python ml/train_symptom_model.py

# Start server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend (React + Vite):
```bash
cd frontend
npm install
npm run dev
```

App is live at: `http://localhost:5173`
FastAPI Swagger Docs at: `http://localhost:8000/docs`
