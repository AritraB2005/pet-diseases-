"""
Smoke test script for backend ML pipeline & functions
"""
import sys
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from main import PetProfile, DiagnosticRequest, run_multimodal_analysis, health_check, get_symptoms_catalog, mobile_symptoms_tree

def test_pipeline():
    print("[*] Testing health_check()...")
    health = health_check()
    print("Health response:", health)
    assert health["status"] == "healthy"

    print("\n[*] Testing get_symptoms_catalog()...")
    syms = get_symptoms_catalog()
    print("Symptoms count:", syms["total_symptoms"])
    assert syms["total_symptoms"] > 15

    print("\n[*] Testing mobile_symptoms_tree()...")
    m_syms = mobile_symptoms_tree()
    print("Mobile categories count:", len(m_syms["categories"]))
    assert len(m_syms["categories"]) == 4

    print("\n[*] Testing run_multimodal_analysis with Parvovirus symptoms (Puppy with vomiting & bloody stool)...")
    dog_profile = PetProfile(
        species="Dog",
        breed="German Shepherd",
        age_months=4.0,
        weight_kg=7.5
    )
    dog_res = run_multimodal_analysis(
        profile=dog_profile,
        symptoms=["vomiting", "diarrhea", "bloody_stool", "extreme_lethargy", "loss_of_appetite", "dehydration"],
        severity="Severe",
        duration_days=2
    )
    print("Dog Overall Urgency:", dog_res.overall_urgency, f"({dog_res.overall_urgency_badge})")
    top_pred = dog_res.top_predictions[0]
    print(f"Top Prediction: {top_pred.condition_name} ({top_pred.confidence_score}%) - Urgency: {top_pred.urgency_badge}")
    print("Why it matches:", top_pred.why_matches)
    print("Recommended steps:", top_pred.recommended_steps[:2])
    assert top_pred.condition_name == "Canine Parvovirus"
    assert dog_res.overall_urgency == "High"
    print("[+] Parvovirus test PASSED!")

    print("\n[*] Testing run_multimodal_analysis with Cat URI symptoms...")
    cat_profile = PetProfile(
        species="Cat",
        breed="Persian",
        age_months=12.0,
        weight_kg=3.8
    )
    cat_res = run_multimodal_analysis(
        profile=cat_profile,
        symptoms=["sneezing", "nasal_discharge", "eye_discharge", "fever"],
        severity="Moderate",
        duration_days=3
    )
    cat_top = cat_res.top_predictions[0]
    print(f"Cat Top Prediction: {cat_top.condition_name} ({cat_top.confidence_score}%)")
    assert cat_top.condition_name == "Feline Upper Respiratory Infection"
    print("[+] Cat URI test PASSED!")

    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")

if __name__ == "__main__":
    test_pipeline()
