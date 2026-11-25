import React, { useState } from 'react';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Code2,
  Terminal,
  Send,
  ExternalLink,
  Zap,
  Globe
} from 'lucide-react';
import { apiFetch } from '../apiConfig';

export default function MobileApiDocsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('endpoints');
  const [copiedKey, setCopiedKey] = useState(null);
  const [liveResponse, setLiveResponse] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestMobileEndpoint = async () => {
    setLoadingLive(true);
    try {
      const res = await apiFetch('/api/v1/mobile/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pet_profile: {
            species: 'Dog',
            breed: 'Labrador Retriever',
            age_months: 6.0,
            weight_kg: 14.5
          },
          symptoms: ['vomiting', 'diarrhea', 'extreme_lethargy'],
          severity: 'Severe',
          duration_days: 2
        })
      });
      const data = await res.json();
      setLiveResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setLiveResponse(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setLoadingLive(false);
    }
  };

  const SWIFT_SNIPPET = `// Swift (iOS) - Native Mobile Integration
import Foundation

struct PetProfile: Codable {
    let species: String
    let breed: String
    let age_months: Double
    let weight_kg: Double
}

struct TriagePayload: Codable {
    let pet_profile: PetProfile
    let symptoms: [String]
    let severity: String
    let duration_days: Int
}

func analyzePetSymptoms() async throws {
    guard let url = URL(string: "http://YOUR_SERVER:8000/api/v1/mobile/analyze") else { return }
    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    let payload = TriagePayload(
        pet_profile: PetProfile(species: "Dog", breed: "Beagle", age_months: 8.0, weight_kg: 9.0),
        symptoms: ["severe_itching", "red_inflamed_skin"],
        severity: "Moderate",
        duration_days: 4
    )
    request.httpBody = try JSONEncoder().encode(payload)

    let (data, _) = try await URLSession.shared.data(for: request)
    print("Mobile Response: \\(String(data: data, encoding: .utf8) ?? "")")
}`;

  const KOTLIN_SNIPPET = `// Kotlin (Android) - OkHttp / Retrofit
import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONArray
import org.json.JSONObject

val client = OkHttpClient()
val jsonBody = JSONObject().apply {
    put("pet_profile", JSONObject().apply {
        put("species", "Cat")
        put("breed", "Persian")
        put("age_months", 14.0)
        put("weight_kg", 4.2)
    })
    put("symptoms", JSONArray(listOf("sneezing", "nasal_discharge")))
    put("severity", "Moderate")
    put("duration_days", 3)
}

val request = Request.Builder()
    .url("http://YOUR_SERVER:8000/api/v1/mobile/analyze")
    .post(jsonBody.toString().toRequestBody("application/json".toMediaType()))
    .build()

client.newCall(request).execute().use { response ->
    println("Mobile Triage Result: " + response.body?.string())
}`;

  const FLUTTER_SNIPPET = `// Dart (Flutter) - Independent Mobile API
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> queryVeterinaryTriage() async {
  final url = Uri.parse('http://YOUR_SERVER:8000/api/v1/mobile/analyze');
  final response = await http.post(
    url,
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'pet_profile': {
        'species': 'Dog',
        'breed': 'Indie',
        'age_months': 5.0,
        'weight_kg': 8.0
      },
      'symptoms': ['vomiting', 'bloody_stool', 'dehydration'],
      'severity': 'Severe',
      'duration_days': 2
    }),
  );

  final result = jsonDecode(response.body);
  print('Is Emergency: \${result["is_emergency"]}');
  print('Top Condition: \${result["top_conditions"][0]["name"]}');
}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Independent Mobile API (v1)</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-teal-400 text-slate-950">
                  Ready for Production
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Ultra-lightweight, RESTful endpoints designed for iOS, Android, and Flutter apps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-slate-200 px-6 pt-3 bg-slate-50 gap-4 text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('endpoints')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'endpoints'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            REST Endpoints
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'code'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Mobile Code Snippets (Swift / Kotlin / Dart)
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-3 border-b-2 transition ${
              activeTab === 'live'
                ? 'border-teal-600 text-teal-800'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            Live Test Console
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto text-xs space-y-4">
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-teal-600 text-white">
                      POST
                    </span>
                    <code className="font-mono font-bold text-slate-800">/api/v1/mobile/analyze</code>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Core Inference</span>
                </div>
                <p className="text-slate-600">
                  Accepts JSON payload with patient demographics, symptom IDs, and optional base64 image. Returns emergency flag, urgency level, top 3 conditions, and clinical action steps.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-600 text-white">
                      GET
                    </span>
                    <code className="font-mono font-bold text-slate-800">/api/v1/mobile/symptoms</code>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Dynamic Taxonomy</span>
                </div>
                <p className="text-slate-600">
                  Allows mobile apps to dynamically fetch all symptom categories, icon hints, and clinical descriptions without hardcoding.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-600 text-white">
                      GET
                    </span>
                    <code className="font-mono font-bold text-slate-800">/api/v1/mobile/breeds</code>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">Breed Suggestions</span>
                </div>
                <p className="text-slate-600">
                  Returns curated dog and cat breed arrays for mobile autocomplete input controls.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[11px] font-bold bg-emerald-600 text-white">
                      GET
                    </span>
                    <code className="font-mono font-bold text-slate-800">/docs</code>
                  </div>
                  <a
                    href="http://127.0.0.1:8000/docs"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-bold"
                  >
                    <span>Open Swagger UI</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
                <p className="text-slate-600">
                  Interactive OpenAPI / Swagger specification with live "Try It Out" functionality.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4">
              {/* Flutter */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
                  <span>Flutter (Dart)</span>
                  <button
                    onClick={() => copyToClipboard(FLUTTER_SNIPPET, 'flutter')}
                    className="flex items-center gap-1 text-white hover:text-teal-400 font-sans"
                  >
                    {copiedKey === 'flutter' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'flutter' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {FLUTTER_SNIPPET}
                </pre>
              </div>

              {/* Swift */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
                  <span>Swift (iOS)</span>
                  <button
                    onClick={() => copyToClipboard(SWIFT_SNIPPET, 'swift')}
                    className="flex items-center gap-1 text-white hover:text-teal-400 font-sans"
                  >
                    {copiedKey === 'swift' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'swift' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {SWIFT_SNIPPET}
                </pre>
              </div>

              {/* Kotlin */}
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-800 text-slate-300 px-4 py-2 flex items-center justify-between text-[11px] font-mono">
                  <span>Kotlin (Android)</span>
                  <button
                    onClick={() => copyToClipboard(KOTLIN_SNIPPET, 'kotlin')}
                    className="flex items-center gap-1 text-white hover:text-teal-400 font-sans"
                  >
                    {copiedKey === 'kotlin' ? <Check className="w-3.5 h-3.5 text-teal-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'kotlin' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-900 text-teal-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
                  {KOTLIN_SNIPPET}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'live' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-slate-600">
                  Trigger an immediate live test request to <code>POST /api/v1/mobile/analyze</code> right now:
                </p>
                <button
                  onClick={handleTestMobileEndpoint}
                  disabled={loadingLive}
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold inline-flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{loadingLive ? 'Querying...' : 'Dispatch Mobile Ping'}</span>
                </button>
              </div>

              {liveResponse && (
                <div className="rounded-xl overflow-hidden border border-slate-200 mt-3">
                  <div className="bg-slate-800 text-slate-300 px-4 py-2 font-mono text-[11px]">
                    Live Server JSON Response
                  </div>
                  <pre className="p-4 bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-80">
                    {liveResponse}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between text-xs text-slate-500">
          <span>FastAPI Backend • CORS Enabled for Android Emulator (10.0.2.2) and iOS Simulators</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
