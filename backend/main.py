"""
Pet Disease Analyzer - Production FastAPI Backend & Multi-Modal ML Engine
Integrates XGBoost Tabular Clinical Symptom Model + PyTorch MobileNetV3 Vision Inference.
Includes independent Mobile APIs with OpenAPI documentation.
"""

import base64
import json
import os
import sys
from typing import List, Optional, Dict, Any

import joblib
import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure local ml directory is accessible
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from ml.image_analyzer import vision_analyzer

# Paths to ML artifacts
ML_DIR = os.path.join(BASE_DIR, "ml")
MODEL_PATH = os.path.join(ML_DIR, "symptom_model.joblib")
ENCODER_PATH = os.path.join(ML_DIR, "label_encoder.joblib")
METADATA_PATH = os.path.join(ML_DIR, "metadata.json")

# Load models and metadata
if not os.path.exists(MODEL_PATH) or not os.path.exists(METADATA_PATH):
    raise RuntimeError("Model artifacts not found! Run 'python ml/train_symptom_model.py' first.")

symptom_model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)

with open(METADATA_PATH, "r", encoding="utf-8") as f:
    METADATA = json.load(f)

ALL_FEATURE_COLUMNS = METADATA["all_feature_columns"]
FEATURE_SYMPTOMS = METADATA["feature_symptoms"]
SYMPTOMS_CATALOG = METADATA["symptoms_catalog"]
DISEASE_PROFILES = METADATA["disease_profiles"]
CLASSES = METADATA["classes"]

# Initialize FastAPI app
app = FastAPI(
    title="Pet Disease Analyzer API",
    description="Multimodal AI-driven veterinary symptom triage & dermatological lesion analyzer. Designed for web and native mobile apps.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for all clients (web, iOS/Android emulators, mobile apps)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Pydantic Models -----------------

class PetProfile(BaseModel):
    species: str = Field(..., description="Species: 'Dog' or 'Cat'")
    breed: Optional[str] = Field("Mixed Breed", description="Pet breed")
    age_months: float = Field(..., ge=0.5, le=360, description="Pet age in months")
    weight_kg: float = Field(..., ge=0.2, le=120, description="Pet weight in kilograms")

class DiagnosticRequest(BaseModel):
    pet_profile: PetProfile
    symptoms: List[str] = Field(..., description="List of symptom IDs selected by the user")
    severity: str = Field("Moderate", description="Mild, Moderate, or Severe")
    duration_days: int = Field(3, ge=1, le=180, description="Duration of symptoms in days")
    image_base64: Optional[str] = Field(None, description="Optional base64 encoded photo of visible symptoms")

class PredictedCondition(BaseModel):
    condition_name: str
    confidence_score: float
    urgency_tier: str  # "Low", "Moderate", "High"
    urgency_badge: str  # Full display badge
    why_matches: str
    recommended_steps: List[str]
    symptom_match_pct: float
    visual_match_pct: Optional[float] = None

class DiagnosticResponse(BaseModel):
    status: str
    pet_summary: Dict[str, Any]
    overall_urgency: str
    overall_urgency_badge: str
    top_predictions: List[PredictedCondition]
    visual_analysis: Optional[Dict[str, Any]] = None
    medical_disclaimer: str

# ----------------- Helper Functions -----------------

DISCLAIMER_TEXT = (
    "CRITICAL VETERINARY MEDICAL DISCLAIMER: This Pet Disease Analyzer is an automated AI "
    "triage tool provided for informational and preliminary guidance purposes only. It does NOT "
    "constitute formal veterinary diagnosis, prognosis, or medical prescription. If your pet exhibits "
    "acute distress, respiratory failure, hemorrhagic vomit/stool, or severe trauma, seek care at an "
    "emergency veterinary clinic immediately."
)

SEVERITY_MAP = {
    "mild": 1,
    "moderate": 2,
    "severe": 3
}

def build_feature_vector(profile: PetProfile, symptoms: List[str], severity_str: str, duration: int) -> np.ndarray:
    spec_code = 0.0 if profile.species.lower() == "dog" else 1.0
    sev_val = float(SEVERITY_MAP.get(severity_str.lower(), 2))

    row = [
        spec_code,
        float(profile.age_months),
        float(profile.weight_kg),
        float(duration),
        sev_val
    ]

    selected_set = set(symptoms)
    for sym_col in FEATURE_SYMPTOMS:
        row.append(1.0 if sym_col in selected_set else 0.0)

    return np.array([row], dtype=np.float32)


def run_multimodal_analysis(
    profile: PetProfile,
    symptoms: List[str],
    severity: str,
    duration_days: int,
    image_bytes: Optional[bytes] = None
) -> DiagnosticResponse:
    # 1. Tabular Symptom Inference via XGBoost
    X_vec = build_feature_vector(profile, symptoms, severity, duration_days)
    proba_matrix = symptom_model.predict_proba(X_vec)[0]

    # Map class probabilities
    condition_scores = {}
    for idx, class_name in enumerate(label_encoder.classes_):
        p = float(proba_matrix[idx])
        # Biological filter: eliminate species-specific mismatch
        target_species = DISEASE_PROFILES.get(class_name, {}).get("species", ["Dog", "Cat"])
        if profile.species not in target_species:
            p = p * 0.01  # drastically dampen species-incompatible disease
        condition_scores[class_name] = {
            "symptom_score": p,
            "visual_score": None,
            "final_score": p
        }

    # 2. Vision Inference (if image provided)
    vision_result = None
    if image_bytes and len(image_bytes) > 0:
        vision_result = vision_analyzer.analyze_image(image_bytes)
        if vision_result.get("success"):
            # Fuse vision predictions
            for v_pred in vision_result.get("predictions", []):
                matched_cond = v_pred["matched_disease"]
                v_prob = v_pred["confidence_pct"] / 100.0

                if matched_cond in condition_scores:
                    s_score = condition_scores[matched_cond]["symptom_score"]
                    # Multi-modal weighted fusion: 60% tabular symptoms + 40% visual evidence
                    fused = (s_score * 0.60) + (v_prob * 0.40)
                    condition_scores[matched_cond]["visual_score"] = v_prob
                    condition_scores[matched_cond]["final_score"] = fused

    # Re-normalize final scores across valid candidates
    total_fused = sum(c["final_score"] for c in condition_scores.values()) or 1.0
    for c in condition_scores.values():
        c["final_score"] = c["final_score"] / total_fused

    # Sort top 3 conditions
    sorted_conditions = sorted(
        condition_scores.items(),
        key=lambda item: item[1]["final_score"],
        reverse=True
    )[:3]

    top_predictions: List[PredictedCondition] = []
    highest_urgency = "Low"
    urgency_ranks = {"Low": 1, "Moderate": 2, "High": 3}

    for cond_name, score_dict in sorted_conditions:
        prof = DISEASE_PROFILES.get(cond_name, {
            "urgency": "Moderate",
            "urgency_label": "Moderate / Schedule Vet Visit",
            "why_matches": "Clinical symptom presentation corresponds with this pathological profile.",
            "recommended_steps": ["Consult a licensed veterinarian for formal assessment."]
        })

        urg = prof.get("urgency", "Moderate")
        if urgency_ranks.get(urg, 1) > urgency_ranks.get(highest_urgency, 1):
            highest_urgency = urg

        final_pct = round(score_dict["final_score"] * 100, 1)
        sym_pct = round(score_dict["symptom_score"] * 100, 1)
        vis_pct = round(score_dict["visual_score"] * 100, 1) if score_dict["visual_score"] is not None else None

        # Build custom explanation context
        age_str = f"{profile.age_months:.0f} month old" if profile.age_months < 24 else f"{profile.age_months/12:.1f} year old"
        custom_why = f"In this {age_str} {profile.species} ({profile.breed or 'mixed'}), {prof.get('why_matches', '')}"

        top_predictions.append(PredictedCondition(
            condition_name=cond_name,
            confidence_score=max(1.0, min(99.0, final_pct)),
            urgency_tier=urg,
            urgency_badge=prof.get("urgency_label", "Moderate / Schedule Vet Visit"),
            why_matches=custom_why,
            recommended_steps=prof.get("recommended_steps", []),
            symptom_match_pct=sym_pct,
            visual_match_pct=vis_pct
        ))

    overall_badge_map = {
        "High": "High / Emergency Care Required",
        "Moderate": "Moderate / Schedule Vet Visit",
        "Low": "Low / Monitor at Home"
    }

    return DiagnosticResponse(
        status="success",
        pet_summary={
            "species": profile.species,
            "breed": profile.breed or "Mixed Breed",
            "age_months": profile.age_months,
            "weight_kg": profile.weight_kg,
            "duration_days": duration_days,
            "severity": severity,
            "symptom_count": len(symptoms)
        },
        overall_urgency=highest_urgency,
        overall_urgency_badge=overall_badge_map.get(highest_urgency, "Moderate / Schedule Vet Visit"),
        top_predictions=top_predictions,
        visual_analysis=vision_result,
        medical_disclaimer=DISCLAIMER_TEXT
    )

# ----------------- API Endpoints -----------------

@app.get("/")
def root():
    return {
        "service": "Pet Disease Analyzer API",
        "version": "1.0.0",
        "status": "online",
        "documentation": "/docs",
        "mobile_api_root": "/api/v1/mobile"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "models": {
            "symptom_xgboost": "active",
            "vision_mobilenet_v3": "active"
        },
        "supported_conditions_count": len(CLASSES),
        "supported_conditions": CLASSES
    }

@app.get("/api/symptoms")
def get_symptoms_catalog():
    """Returns all symptoms organized by category for the frontend UI chips."""
    return {
        "categories": SYMPTOMS_CATALOG,
        "total_symptoms": len(FEATURE_SYMPTOMS)
    }

@app.post("/api/analyze", response_model=DiagnosticResponse)
def analyze_symptoms(payload: DiagnosticRequest):
    """
    Standard full-stack analysis endpoint accepting JSON payload with optional base64 image.
    Combines tabular clinical ML with neural vision inference.
    """
    image_bytes = None
    if payload.image_base64:
        try:
            # Handle possible data URL prefix (e.g. data:image/jpeg;base64,...)
            raw_b64 = payload.image_base64
            if "," in raw_b64:
                raw_b64 = raw_b64.split(",", 1)[1]
            image_bytes = base64.b64decode(raw_b64)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {str(e)}")

    return run_multimodal_analysis(
        profile=payload.pet_profile,
        symptoms=payload.symptoms,
        severity=payload.severity,
        duration_days=payload.duration_days,
        image_bytes=image_bytes
    )

@app.post("/api/analyze/upload", response_model=DiagnosticResponse)
async def analyze_symptoms_multipart(
    species: str = Form("Dog"),
    breed: str = Form("Mixed Breed"),
    age_months: float = Form(24.0),
    weight_kg: float = Form(10.0),
    symptoms: str = Form("[]"),  # JSON array string e.g. ["vomiting", "diarrhea"]
    severity: str = Form("Moderate"),
    duration_days: int = Form(3),
    image: Optional[UploadFile] = File(None)
):
    """
    Multipart/form-data upload endpoint supporting direct file uploads from forms or mobile clients.
    """
    try:
        symptom_list = json.loads(symptoms)
        if not isinstance(symptom_list, list):
            symptom_list = [str(symptom_list)]
    except Exception:
        symptom_list = [s.strip() for s in symptoms.split(",") if s.strip()]

    profile = PetProfile(
        species=species,
        breed=breed,
        age_months=age_months,
        weight_kg=weight_kg
    )

    image_bytes = None
    if image is not None:
        image_bytes = await image.read()

    return run_multimodal_analysis(
        profile=profile,
        symptoms=symptom_list,
        severity=severity,
        duration_days=duration_days,
        image_bytes=image_bytes
    )

# ----------------- Independent Dedicated Mobile API (v1) -----------------

@app.get("/api/v1/mobile/health")
def mobile_health():
    """Lightweight ping endpoint for mobile apps to verify connectivity and sync model versions."""
    return {
        "status": "ok",
        "version": "1.0.0",
        "mobile_protocol": "v1",
        "api_ready": True
    }

@app.get("/api/v1/mobile/symptoms")
def mobile_symptoms_tree():
    """
    Independent mobile endpoint delivering dynamic categories, searchable chips,
    icon keys, and localized descriptions for iOS / Android / Flutter apps.
    """
    icon_map = {
        "Digestive": "stomach",
        "Skin & Coat": "shield-alert",
        "Respiratory": "wind",
        "Behavioral & Systemic": "activity"
    }

    mobile_categories = []
    for cat_name, sym_items in SYMPTOMS_CATALOG.items():
        mobile_categories.append({
            "category_name": cat_name,
            "icon_hint": icon_map.get(cat_name, "alert-circle"),
            "items": [
                {
                    "id": item["id"],
                    "name": item["label"],
                    "description": item["desc"]
                }
                for item in sym_items
            ]
        })

    return {
        "success": True,
        "categories": mobile_categories,
        "severities": ["Mild", "Moderate", "Severe"],
        "default_duration_days": 3
    }

@app.get("/api/v1/mobile/breeds")
def mobile_breeds():
    """Returns curated breed list for mobile autocomplete pickers."""
    return {
        "Dog": [
            "Mixed Breed / Indie", "Golden Retriever", "Labrador Retriever", "German Shepherd",
            "Bulldog", "Pug", "Beagle", "Poodle", "Rottweiler", "Shih Tzu", "Siberian Husky",
            "Dachshund", "Boxer", "Great Dane", "Chihuahua", "Cocker Spaniel", "Other"
        ],
        "Cat": [
            "Domestic Shorthair", "Persian Cat", "Siamese Cat", "Maine Coon", "Bengal Cat",
            "Ragdoll", "British Shorthair", "Sphynx", "Russian Blue", "Other"
        ]
    }

@app.post("/api/v1/mobile/analyze")
def mobile_analyze(payload: DiagnosticRequest):
    """
    High-efficiency mobile JSON inference endpoint.
    Returns optimized payloads with quick action flags and offline-capable emergency triage summaries.
    """
    result = analyze_symptoms(payload)
    return {
        "success": True,
        "is_emergency": result.overall_urgency == "High",
        "urgency_tier": result.overall_urgency,
        "urgency_badge": result.overall_urgency_badge,
        "top_conditions": [
            {
                "name": p.condition_name,
                "confidence": p.confidence_score,
                "urgency": p.urgency_tier,
                "urgency_badge": p.urgency_badge,
                "rationale": p.why_matches,
                "action_items": p.recommended_steps,
                "symptom_confidence": p.symptom_match_pct,
                "visual_confidence": p.visual_match_pct
            }
            for p in result.top_predictions
        ],
        "visual_findings": result.visual_analysis.get("visual_findings") if result.visual_analysis else [],
        "disclaimer": result.medical_disclaimer
    }
