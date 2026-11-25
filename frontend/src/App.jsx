import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Sparkles,
  Smartphone,
  AlertCircle,
  RotateCcw,
  Send,
  Loader2,
  HeartPulse,
  ShieldCheck,
  Activity,
  FileCode,
  Github
} from 'lucide-react';

import MedicalDisclaimer from './components/MedicalDisclaimer';
import PetProfileSelector from './components/PetProfileSelector';
import SymptomSelector from './components/SymptomSelector';
import ImageUploader from './components/ImageUploader';
import ResultsDashboard from './components/ResultsDashboard';
import MobileApiDocsModal from './components/MobileApiDocsModal';
import { apiFetch } from './apiConfig';

const DEFAULT_PROFILE = {
  species: 'Dog',
  breed: 'Mixed Breed / Indie',
  age_months: 18,
  weight_kg: 12.0
};

export default function App() {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [categories, setCategories] = useState(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [severity, setSeverity] = useState('Moderate');
  const [durationDays, setDurationDays] = useState(3);
  const [imagePreview, setImagePreview] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [backendStatus, setBackendStatus] = useState('connecting');
  const [showMobileModal, setShowMobileModal] = useState(false);

  // Fetch symptom categories and verify backend health on startup
  useEffect(() => {
    async function initData() {
      try {
        const [healthRes, symRes] = await Promise.all([
          apiFetch('/api/health'),
          apiFetch('/api/symptoms')
        ]);

        if (healthRes.ok) {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }

        if (symRes.ok) {
          const symData = await symRes.json();
          setCategories(symData.categories);
        }
      } catch (err) {
        console.warn('Backend connection notice:', err);
        setBackendStatus('offline');
      }
    }
    initData();
  }, []);

  const handleToggleSymptom = (symId) => {
    setSelectedSymptoms((prev) =>
      prev.includes(symId) ? prev.filter((id) => id !== symId) : [...prev, symId]
    );
  };

  const handleClearSymptoms = () => {
    setSelectedSymptoms([]);
  };

  const handleApplyPreset = (preset) => {
    setProfile((prev) => ({
      ...prev,
      species: preset.species,
      breed: preset.species === 'Dog' ? 'Golden Retriever' : 'Persian Cat'
    }));
    setSelectedSymptoms(preset.symptoms);
    setSeverity(preset.severity);
    setDurationDays(preset.duration);
    setErrorMsg('');
  };

  const handleAnalyze = async () => {
    if (selectedSymptoms.length === 0 && !imagePreview) {
      setErrorMsg('Please select at least one clinical symptom or upload a photo to begin triage.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        pet_profile: {
          species: profile.species,
          breed: profile.breed,
          age_months: profile.age_months,
          weight_kg: profile.weight_kg
        },
        symptoms: selectedSymptoms,
        severity: severity,
        duration_days: durationDays,
        image_base64: imagePreview?.previewUrl || null
      };

      const res = await apiFetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Analysis request failed');
      }

      const data = await res.json();
      setAnalysisResult(data);

      // Smooth scroll to results
      setTimeout(() => {
        document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setErrorMsg(`Failed to analyze: ${err.message}. Please check that the FastAPI server is running on port 8000.`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisResult(null);
    setSelectedSymptoms([]);
    setImagePreview(null);
    setSeverity('Moderate');
    setDurationDays(3);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f6] text-slate-800">
      {/* 1. Persistent Medical Disclaimer Banner */}
      <MedicalDisclaimer />

      {/* 2. Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <HeartPulse className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  PetCare AI
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  Multimodal Triage
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Clinical Symptom Machine Learning (XGBoost) + PyTorch MobileNetV3 Vision
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5">
            {/* Backend Connection Indicator */}
            <div
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                backendStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title="FastAPI Backend Health Status"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span>{backendStatus === 'connected' ? 'ML Engine Online' : 'FastAPI Connecting...'}</span>
            </div>

            {/* Independent Mobile API Hub Button */}
            <button
              onClick={() => setShowMobileModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs hover:shadow"
            >
              <Smartphone className="w-3.5 h-3.5 text-teal-400" />
              <span>Mobile API Docs</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-2xs animate-fadeIn">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <strong className="font-bold">Notice: </strong>
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={() => setErrorMsg('')}
              className="text-rose-500 hover:text-rose-700 font-bold text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Pet Profile Demographic Selector */}
        <PetProfileSelector profile={profile} onChange={setProfile} />

        {/* Step 2 & 3: Dual-Mode Diagnostic Inputs (2 Column on Desktop) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Symptom Multi-Select Area (7 cols on large screens) */}
          <div className="lg:col-span-7">
            <SymptomSelector
              categories={categories}
              selectedSymptoms={selectedSymptoms}
              onToggleSymptom={handleToggleSymptom}
              onClearSymptoms={handleClearSymptoms}
              severity={severity}
              onSeverityChange={setSeverity}
              durationDays={durationDays}
              onDurationChange={setDurationDays}
              onApplyPreset={handleApplyPreset}
            />
          </div>

          {/* Visual Image Uploader (5 cols on large screens) */}
          <div className="lg:col-span-5 space-y-6">
            <ImageUploader
              imagePreview={imagePreview}
              onImageSelected={setImagePreview}
              onImageCleared={() => setImagePreview(null)}
            />

            {/* Quick Diagnostic Summary & Action Trigger */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Triage Input Summary
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {profile.species} • {selectedSymptoms.length} signs • {imagePreview ? '1 image' : 'No photo'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient:</span>
                  <span className="font-semibold text-slate-800">
                    {profile.breed} ({profile.species})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Age & Weight:</span>
                  <span className="font-semibold text-slate-800">
                    {profile.age_months} months / {profile.weight_kg} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Severity & Duration:</span>
                  <span className="font-semibold text-slate-800">
                    {severity} ({durationDays} days)
                  </span>
                </div>
              </div>

              {/* Main Submit Action */}
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-sm sm:text-base tracking-wide transition-all shadow-md shadow-teal-600/25 hover:shadow-lg hover:shadow-teal-600/35 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Running Multimodal Diagnostic Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 text-teal-200" />
                    <span>Run Disease Analysis</span>
                  </>
                )}
              </button>

              <p className="text-[11px] text-center text-slate-400 leading-tight">
                Simultaneously evaluates XGBoost clinical probabilities & MobileNetV3 visual indicators
              </p>
            </div>
          </div>
        </div>

        {/* Step 4: Results Dashboard (Anchor for smooth scroll) */}
        <div id="results-section">
          {analysisResult && (
            <ResultsDashboard
              result={analysisResult}
              onReset={handleReset}
            />
          )}
        </div>
      </main>

      {/* 4. Independent Mobile API Documentation Modal */}
      <MobileApiDocsModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
      />

      {/* 5. Footer */}
      <footer className="mt-12 bg-white border-t border-slate-200/80 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-teal-600" />
            <span className="font-bold text-slate-700">PetCare AI Triage System</span>
            <span>—</span>
            <span>Full-Stack FastAPI & React (Vite + Tailwind CSS)</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setShowMobileModal(true)}
              className="text-teal-700 hover:text-teal-900 underline"
            >
              Independent Mobile REST API
            </button>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-800"
            >
              Interactive Swagger API (/docs)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
