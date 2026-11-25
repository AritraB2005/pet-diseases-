"""
Veterinary Disease Symptom Classifier - Training Pipeline
Trains an XGBoost multi-class classifier on realistic synthetic veterinary triage data.
Generates:
  - symptom_model.joblib
  - label_encoder.joblib
  - metadata.json (features, disease definitions, urgency mappings, vet guidance)
"""

import json
import os
import random
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import classification_report, accuracy_score
from xgboost import XGBClassifier

# Set reproducible seeds
np.random.seed(42)
random.seed(42)

# Directory references
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(CURRENT_DIR, "symptom_model.joblib")
ENCODER_PATH = os.path.join(CURRENT_DIR, "label_encoder.joblib")
METADATA_PATH = os.path.join(CURRENT_DIR, "metadata.json")

# Define all 21 key clinical symptoms grouped logically
SYMPTOMS_CATALOG = {
    "Digestive": [
        {"id": "vomiting", "label": "Vomiting", "desc": "Frequent throwing up food, bile, or foam"},
        {"id": "diarrhea", "label": "Diarrhea / Loose Stool", "desc": "Watery or unusually frequent stools"},
        {"id": "bloody_stool", "label": "Bloody Stool (Hematochezia/Melena)", "desc": "Dark tarry or bright red blood in feces"},
        {"id": "loss_of_appetite", "label": "Anorexia / Loss of Appetite", "desc": "Refusal to eat food or drink water"},
        {"id": "abdominal_pain", "label": "Abdominal Guarding / Pain", "desc": "Tense belly, crying when touched"},
        {"id": "dehydration", "label": "Dehydration (Lethargic Skin Turgor)", "desc": "Dry gums, slow skin snap-back"}
    ],
    "Skin & Coat": [
        {"id": "severe_itching", "label": "Intense Scratching / Pruritus", "desc": "Persistent scratching, licking, or biting skin"},
        {"id": "hair_loss", "label": "Hair Loss / Alopecia", "desc": "Patchy, circular, or generalized thinning/baldness"},
        {"id": "red_inflamed_skin", "label": "Erythema / Redness", "desc": "Flushed, irritated, or inflamed dermis"},
        {"id": "scabs_crusts", "label": "Scabs & Crusts", "desc": "Dry flaking, crusty lesions or sores"},
        {"id": "pustules_bumps", "label": "Pustules / Papules / Rash", "desc": "Small pimples, hot spots, or raised bumps"},
        {"id": "foul_odor_coat", "label": "Foul Odor from Skin / Coat", "desc": "Yeasty, rancid, or sour smell from pet"},
        {"id": "ear_discharge_odor", "label": "Ear Discharge / Waxy Buildup", "desc": "Dark brown or yellow discharge in ear canal"},
        {"id": "head_shaking", "label": "Head Shaking / Tilting", "desc": "Vigorous or repetitive shaking of ears and head"}
    ],
    "Respiratory": [
        {"id": "sneezing", "label": "Sneezing Episodes", "desc": "Recurrent or paroxysmal sneezing"},
        {"id": "nasal_discharge", "label": "Nasal Discharge", "desc": "Clear, mucoid, or yellowish discharge from nostrils"},
        {"id": "coughing", "label": "Coughing / Hacking", "desc": "Dry goose-honk or moist productive cough"},
        {"id": "eye_discharge", "label": "Eye Discharge (Ocular Secretions)", "desc": "Crusty, watery, or purulent drainage around eyes"},
        {"id": "wheezing_dyspnea", "label": "Labored Breathing / Wheezing", "desc": "Open-mouth breathing, flared nostrils, shortness of breath"}
    ],
    "Behavioral & Systemic": [
        {"id": "fever", "label": "Fever / Hyperthermia", "desc": "Body feels abnormally warm, lethargy with chills"},
        {"id": "extreme_lethargy", "label": "Extreme Lethargy / Depression", "desc": "Severe unresponsiveness, lack of energy to walk"},
        {"id": "pale_gums", "label": "Pale or White Gums / Mucosa", "desc": "Loss of healthy pink gum coloration (anemia sign)"},
        {"id": "reluctance_to_move", "label": "Stiffness / Reluctance to Move", "desc": "Joint stiffness, hesitance to climb stairs or stand"},
        {"id": "pain_vocalizing", "label": "Whining / Vocalizing in Pain", "desc": "Yelping, crying, or defensive aggression"}
    ]
}

FEATURE_SYMPTOMS = [s["id"] for cat in SYMPTOMS_CATALOG.values() for s in cat]
NUMERIC_FEATURES = ["species_code", "age_months", "weight_kg", "duration_days", "severity_level"]
ALL_FEATURE_COLUMNS = NUMERIC_FEATURES + FEATURE_SYMPTOMS

DISEASE_PROFILES = {
    "Canine Parvovirus": {
        "species": ["Dog"],
        "urgency": "High",
        "urgency_label": "High / Emergency Care",
        "summary": "Severe, highly contagious viral illness predominantly affecting puppies and unvaccinated dogs.",
        "why_matches": "Marked by acute bloody diarrhea, persistent vomiting, severe dehydration, and extreme lethargy, particularly dangerous in young canines.",
        "recommended_steps": [
            "Seek IMMEDIATE emergency veterinary intensive care within hours.",
            "Do NOT attempt home treatment; intravenous fluid therapy and antiemetics are lifesaving.",
            "Isolate the pet completely from all other dogs; parvo spreads rapidly via footwear and surfaces.",
            "Disinfect living quarters with diluted bleach solution (1:32 ratio)."
        ],
        "dist": {
            "age_range": (1.5, 14),
            "weight_range": (1.5, 25.0),
            "duration_range": (1, 5),
            "severity_weights": [0.05, 0.25, 0.70],
            "p_symptoms": {
                "vomiting": 0.96, "diarrhea": 0.95, "bloody_stool": 0.90, "loss_of_appetite": 0.95,
                "dehydration": 0.92, "extreme_lethargy": 0.94, "fever": 0.78, "abdominal_pain": 0.65,
                "pale_gums": 0.50
            }
        }
    },
    "Feline Upper Respiratory Infection": {
        "species": ["Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Common feline complex (Cat Flu) caused by Feline Herpesvirus-1 (FHV-1) or Calicivirus.",
        "why_matches": "Pronounced sneezing, bilateral nasal and ocular discharge, conjunctivitis, and moderate fever in felines.",
        "recommended_steps": [
            "Schedule a veterinary evaluation within 24–48 hours for antibiotics/antivirals if discharge is mucopurulent.",
            "Gently wipe crusts from nostrils and eyelids with a warm, damp cotton ball.",
            "Place pet in a steamy bathroom for 10-15 minutes twice daily to loosen congestion.",
            "Warm strongly-scented canned food to stimulate appetite through olfactory impairment."
        ],
        "dist": {
            "age_range": (2, 120),
            "weight_range": (1.0, 7.5),
            "duration_range": (2, 14),
            "severity_weights": [0.30, 0.55, 0.15],
            "p_symptoms": {
                "sneezing": 0.96, "nasal_discharge": 0.92, "eye_discharge": 0.88, "fever": 0.65,
                "loss_of_appetite": 0.60, "extreme_lethargy": 0.40, "coughing": 0.35, "wheezing_dyspnea": 0.20
            }
        }
    },
    "Allergic Dermatitis": {
        "species": ["Dog", "Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Hypersensitivity immune response driven by environmental atopy, food proteins, or contact allergens.",
        "why_matches": "Severe, chronic pruritus (scratching), ventral erythema, secondary excoriations, and patchy hair thinning.",
        "recommended_steps": [
            "Schedule a clinical veterinary consult for cytological evaluation and targeted antipruritic therapy (e.g., Apoquel, Cytopoint).",
            "Fit an Elizabethan collar (cone) to break the itch-scratch-trauma cycle.",
            "Bathe in cool water using veterinarian-approved colloidal oatmeal or chlorhexidine shampoo.",
            "Review dietary ingredients with your veterinarian to formulate an elimination trial."
        ],
        "dist": {
            "age_range": (6, 144),
            "weight_range": (3.0, 45.0),
            "duration_range": (5, 60),
            "severity_weights": [0.45, 0.45, 0.10],
            "p_symptoms": {
                "severe_itching": 0.96, "red_inflamed_skin": 0.92, "hair_loss": 0.70, "scabs_crusts": 0.55,
                "pustules_bumps": 0.45, "foul_odor_coat": 0.30
            }
        }
    },
    "Otitis Externa": {
        "species": ["Dog", "Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Acute or chronic inflammation and secondary infection (Malassezia yeast or bacteria) of the external ear canal.",
        "why_matches": "Vigorous head shaking, dark malodorous waxy exudate, localized ear pinna scratching, and vocalized discomfort upon touching the ears.",
        "recommended_steps": [
            "Have your vet perform ear cytology to identify the precise causative organism (yeast vs rod/cocci bacteria).",
            "Do NOT insert Q-tips or cotton swabs into the ear canal, as this risks rupturing the tympanic membrane.",
            "Administer vet-prescribed topical otic drops consistently for the full prescribed duration.",
            "Dry ears thoroughly after baths or swimming sessions."
        ],
        "dist": {
            "age_range": (4, 160),
            "weight_range": (2.5, 50.0),
            "duration_range": (2, 21),
            "severity_weights": [0.35, 0.55, 0.10],
            "p_symptoms": {
                "head_shaking": 0.96, "ear_discharge_odor": 0.95, "severe_itching": 0.75, "pain_vocalizing": 0.55,
                "red_inflamed_skin": 0.40
            }
        }
    },
    "Acute Gastroenteritis": {
        "species": ["Dog", "Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Sudden gastrointestinal inflammation frequently triggered by dietary indiscretion, spoiled food, or minor pathogens.",
        "why_matches": "Sudden onset of vomiting and watery diarrhea without profound systemic organ failure, accompanied by abdominal discomfort.",
        "recommended_steps": [
            "Withhold solid food for 8–12 hours (only for adult animals; NEVER fast puppies, kittens, or diabetic pets).",
            "Offer small sips of clean water or oral electrolyte solution every 30 minutes to gauge retention.",
            "Transition gradually to a bland diet (boiled chicken breast and plain white rice in a 1:2 ratio) for 3–5 days.",
            "Contact a veterinarian promptly if vomiting persists beyond 24 hours or blood appears in vomit."
        ],
        "dist": {
            "age_range": (3, 160),
            "weight_range": (2.0, 50.0),
            "duration_range": (1, 6),
            "severity_weights": [0.45, 0.45, 0.10],
            "p_symptoms": {
                "vomiting": 0.88, "diarrhea": 0.86, "loss_of_appetite": 0.78, "abdominal_pain": 0.50,
                "dehydration": 0.45, "extreme_lethargy": 0.35, "fever": 0.20
            }
        }
    },
    "Canine Tick Fever": {
        "species": ["Dog"],
        "urgency": "High",
        "urgency_label": "High / Emergency Care",
        "summary": "Vector-borne systemic infection (Ehrlichiosis / Babesiosis / Anaplasmosis) transmitted by Rhipicephalus tick bites.",
        "why_matches": "High spiking fever, striking pale/anemic oral mucosa, profound lethargy, joint reluctance to move, and thrombocytopenia risk.",
        "recommended_steps": [
            "Transport pet to a veterinary hospital immediately for a Complete Blood Count (CBC) and tick-borne pathogen PCR/SNAP test.",
            "Prompt administration of doxycycline or specific antiprotozoal injections can be curative if initiated early.",
            "Monitor gums for petechiae (pinpoint red spots) or nosebleeds indicative of low platelet count.",
            "Initiate strict veterinary tick prevention treatments (isoxazoline oral chews or collars)."
        ],
        "dist": {
            "age_range": (6, 150),
            "weight_range": (4.0, 55.0),
            "duration_range": (2, 14),
            "severity_weights": [0.10, 0.40, 0.50],
            "p_symptoms": {
                "fever": 0.94, "extreme_lethargy": 0.92, "pale_gums": 0.85, "loss_of_appetite": 0.88,
                "reluctance_to_move": 0.80, "pain_vocalizing": 0.40, "vomiting": 0.30
            }
        }
    },
    "Ringworm (Dermatophytosis)": {
        "species": ["Dog", "Cat"],
        "urgency": "Low",
        "urgency_label": "Low / Monitor & Vet Evaluation",
        "summary": "Zoonotic fungal skin infection caused by Microsporum canis or Trichophyton mentagrophytes.",
        "why_matches": "Well-demarcated circular alopecia (bald spots), silvery scales, crusting, and mild inflammatory perimeter with minimal severe pruritus.",
        "recommended_steps": [
            "Consult a veterinarian for Wood's lamp examination and fungal culture confirmation.",
            "WEAR GLOVES when touching lesions; Ringworm is highly zoonotic and readily spreads to humans and children.",
            "Apply vet-prescribed topical antifungal miconazole/ketoconazole creams and oral antifungals if widespread.",
            "Wash all pet bedding, rugs, and grooming brushes in hot bleach-diluted water."
        ],
        "dist": {
            "age_range": (1.5, 120),
            "weight_range": (1.0, 35.0),
            "duration_range": (4, 30),
            "severity_weights": [0.60, 0.35, 0.05],
            "p_symptoms": {
                "hair_loss": 0.95, "scabs_crusts": 0.82, "red_inflamed_skin": 0.60, "severe_itching": 0.30,
                "pustules_bumps": 0.25
            }
        }
    },
    "Sarcoptic / Demodectic Mange": {
        "species": ["Dog", "Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Parasitic mite infestation (Sarcoptes scabiei burrowing mites or Demodex follicular mites).",
        "why_matches": "Relentless, frenzied scratching, extensive crusted thickening on ear margins, elbows, and hocks, accompanied by musty sebum odor.",
        "recommended_steps": [
            "Visit the vet for deep skin scrapes to microscopic visualize mite species.",
            "Administer modern isoxazoline parasiticides (e.g., Sarolaner, Fluralaner) as prescribed.",
            "Isolate the pet from other household animals until two negative skin scrapings are achieved.",
            "Wash household textiles on maximum heat setting."
        ],
        "dist": {
            "age_range": (2, 140),
            "weight_range": (2.0, 45.0),
            "duration_range": (7, 45),
            "severity_weights": [0.20, 0.60, 0.20],
            "p_symptoms": {
                "severe_itching": 0.98, "scabs_crusts": 0.90, "hair_loss": 0.88, "red_inflamed_skin": 0.82,
                "foul_odor_coat": 0.68, "pustules_bumps": 0.50
            }
        }
    },
    "Flea Allergy Dermatitis": {
        "species": ["Dog", "Cat"],
        "urgency": "Low",
        "urgency_label": "Low / Home Care & Vet Treatment",
        "summary": "Hypersensitivity reaction triggered by antigens present in flea salivary proteins.",
        "why_matches": "Severe biting at lumbar spine, base of tail, inner thighs, showing 'flea dirt' and pinpoint scabbed crusts.",
        "recommended_steps": [
            "Use a fine-toothed metal flea comb over wet paper towels to reveal telltale reddish-black flea dirt.",
            "Apply an EPA/FDA-approved veterinary fast-kill adulticide (e.g., nitenpyram) and preventative monthly topical/oral protection.",
            "Vacuum carpets, baseboards, and couch cushions daily, discarding the vacuum bag outdoors.",
            "Treat ALL dogs and cats in the residence simultaneously."
        ],
        "dist": {
            "age_range": (3, 160),
            "weight_range": (2.0, 50.0),
            "duration_range": (3, 28),
            "severity_weights": [0.55, 0.40, 0.05],
            "p_symptoms": {
                "severe_itching": 0.95, "hair_loss": 0.85, "scabs_crusts": 0.75, "red_inflamed_skin": 0.70,
                "pustules_bumps": 0.55
            }
        }
    },
    "Infectious Conjunctivitis": {
        "species": ["Dog", "Cat"],
        "urgency": "Moderate",
        "urgency_label": "Moderate / Schedule Vet Visit",
        "summary": "Inflammation of the conjunctival mucosal membranes caused by bacterial, viral, or foreign body irritants.",
        "why_matches": "Mucopurulent ocular secretions, eyelid squinting (blepharospasm), hyperemic red conjunctiva, and pawing at eyes.",
        "recommended_steps": [
            "Have a vet conduct a fluorescein corneal stain to rule out corneal ulcers before applying any steroid-containing drops.",
            "Flush discharge gently with sterile saline eye wash.",
            "Do NOT use human eye drops or leftover medications.",
            "Fit a protective collar if the pet rubs eyes against rugs or with paws."
        ],
        "dist": {
            "age_range": (2, 160),
            "weight_range": (1.5, 45.0),
            "duration_range": (1, 10),
            "severity_weights": [0.45, 0.45, 0.10],
            "p_symptoms": {
                "eye_discharge": 0.98, "red_inflamed_skin": 0.70, "pain_vocalizing": 0.35, "sneezing": 0.25,
                "extreme_lethargy": 0.15
            }
        }
    }
}


def generate_synthetic_veterinary_dataset(samples_per_class=450):
    """Generates clinically coherent multi-feature pet patient profiles."""
    X_rows = []
    y_labels = []

    for condition_name, profile in DISEASE_PROFILES.items():
        dist = profile["dist"]
        allowed_species = profile["species"]

        for _ in range(samples_per_class):
            # Select species
            spec = random.choice(allowed_species)
            spec_code = 0 if spec == "Dog" else 1

            # Generate numeric demographic features
            age = round(random.uniform(dist["age_range"][0], dist["age_range"][1]), 1)
            weight = round(random.uniform(dist["weight_range"][0], dist["weight_range"][1]), 1)
            duration = random.randint(dist["duration_range"][0], dist["duration_range"][1])
            severity = np.random.choice([1, 2, 3], p=dist["severity_weights"])

            row = {
                "species_code": spec_code,
                "age_months": age,
                "weight_kg": weight,
                "duration_days": duration,
                "severity_level": severity
            }

            # Generate symptom flags with high clinical realism
            for sym in FEATURE_SYMPTOMS:
                p_base = dist["p_symptoms"].get(sym, 0.03)  # Low baseline noise for non-indicative symptoms
                # High severity increases probability of systemic distress
                if severity == 3 and sym in ["extreme_lethargy", "loss_of_appetite", "dehydration"]:
                    p_base = min(1.0, p_base + 0.15)
                # Random slight noise
                is_present = 1 if random.random() < p_base else 0
                row[sym] = is_present

            X_rows.append(row)
            y_labels.append(condition_name)

    return X_rows, y_labels


def train_and_save():
    print("[*] Generating synthetic veterinary clinical dataset...")
    X_dict_list, y_raw = generate_synthetic_veterinary_dataset(samples_per_class=500)

    # Convert to matrix
    X_matrix = np.array([[row[col] for col in ALL_FEATURE_COLUMNS] for row in X_dict_list], dtype=np.float32)

    # Encode target labels
    label_encoder = LabelEncoder()
    y_encoded = label_encoder.fit_transform(y_raw)

    print(f"[*] Total dataset size: {len(X_dict_list)} samples across {len(label_encoder.classes_)} conditions.")

    X_train, X_test, y_train, y_test = train_test_split(
        X_matrix, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    print("[*] Training XGBoost Classifier...")
    model = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        objective="multi:softprob",
        eval_metric="mlogloss",
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"[+] Model Evaluation Accuracy: {acc * 100:.2f}%\n")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))

    # Persist model artifacts
    joblib.dump(model, MODEL_PATH)
    joblib.dump(label_encoder, ENCODER_PATH)

    # Export rich metadata
    metadata = {
        "all_feature_columns": ALL_FEATURE_COLUMNS,
        "feature_symptoms": FEATURE_SYMPTOMS,
        "numeric_features": NUMERIC_FEATURES,
        "symptoms_catalog": SYMPTOMS_CATALOG,
        "classes": list(label_encoder.classes_),
        "disease_profiles": {
            name: {
                "urgency": prof["urgency"],
                "urgency_label": prof["urgency_label"],
                "summary": prof["summary"],
                "why_matches": prof["why_matches"],
                "recommended_steps": prof["recommended_steps"],
                "species": prof["species"]
            }
            for name, prof in DISEASE_PROFILES.items()
        }
    }

    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] Saved model to {MODEL_PATH}")
    print(f"[+] Saved encoder to {ENCODER_PATH}")
    print(f"[+] Saved metadata to {METADATA_PATH}")


if __name__ == "__main__":
    train_and_save()
