import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  XCircle,
  Activity,
  Stethoscope,
  Clock,
  Sparkles,
  Info,
  Flame,
  ShieldAlert,
  Wind,
  Check
} from 'lucide-react';

const CATEGORY_ICONS = {
  Digestive: Activity,
  "Skin & Coat": ShieldAlert,
  Respiratory: Wind,
  "Behavioral & Systemic": Flame
};

const CLINICAL_PRESETS = [
  {
    label: "Canine Parvo Risk (Puppy)",
    species: "Dog",
    symptoms: ["vomiting", "diarrhea", "bloody_stool", "extreme_lethargy", "loss_of_appetite", "dehydration"],
    severity: "Severe",
    duration: 2
  },
  {
    label: "Allergic Dermatitis & Itch",
    species: "Dog",
    symptoms: ["severe_itching", "red_inflamed_skin", "hair_loss", "scabs_crusts"],
    severity: "Moderate",
    duration: 10
  },
  {
    label: "Feline Upper Respiratory (Cat Flu)",
    species: "Cat",
    symptoms: ["sneezing", "nasal_discharge", "eye_discharge", "fever"],
    severity: "Moderate",
    duration: 3
  },
  {
    label: "Otitis Externa (Ear Infection)",
    species: "Dog",
    symptoms: ["head_shaking", "ear_discharge_odor", "severe_itching"],
    severity: "Moderate",
    duration: 5
  }
];

export default function SymptomSelector({
  categories,
  selectedSymptoms,
  onToggleSymptom,
  onClearSymptoms,
  severity,
  onSeverityChange,
  durationDays,
  onDurationChange,
  onApplyPreset
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');

  // Filter symptoms based on search query and category
  const filteredCategories = useMemo(() => {
    if (!categories) return {};
    const query = searchQuery.trim().toLowerCase();

    const result = {};
    for (const [catName, symList] of Object.entries(categories)) {
      if (activeCategoryTab !== 'All' && activeCategoryTab !== catName) continue;

      const filtered = symList.filter(
        (s) =>
          s.label.toLowerCase().includes(query) ||
          s.desc.toLowerCase().includes(query) ||
          s.id.toLowerCase().includes(query)
      );
      if (filtered.length > 0) {
        result[catName] = filtered;
      }
    }
    return result;
  }, [categories, searchQuery, activeCategoryTab]);

  const totalFilteredCount = Object.values(filteredCategories).reduce(
    (acc, list) => acc + list.length,
    0
  );

  const getSeverityColor = () => {
    if (severity === 'Mild') return 'text-emerald-700 bg-emerald-50 border-emerald-300';
    if (severity === 'Severe') return 'text-rose-700 bg-rose-50 border-rose-300';
    return 'text-amber-700 bg-amber-50 border-amber-300';
  };

  const getSeveritySliderValue = () => {
    if (severity === 'Mild') return 1;
    if (severity === 'Severe') return 3;
    return 2;
  };

  const handleSliderChange = (val) => {
    if (val === 1) onSeverityChange('Mild');
    else if (val === 3) onSeverityChange('Severe');
    else onSeverityChange('Moderate');
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
            2
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Observed Clinical Symptoms</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-semibold">
                {selectedSymptoms.length} selected
              </span>
            </h2>
            <p className="text-xs text-slate-500">Select all visible manifestations, clinical signs, and behavioral alterations</p>
          </div>
        </div>

        {/* Clear and Preset buttons */}
        <div className="flex items-center gap-2">
          {selectedSymptoms.length > 0 && (
            <button
              type="button"
              onClick={onClearSymptoms}
              className="text-xs text-slate-500 hover:text-rose-600 transition flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-rose-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Clinical Presets Bar */}
      <div className="mb-4 p-2.5 bg-warm-100/70 rounded-xl border border-warm-200/60">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <span>Quick Diagnostic Presets (1-Click Test):</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {CLINICAL_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="px-2.5 py-1 text-xs rounded-lg bg-white hover:bg-teal-50 hover:text-teal-800 border border-slate-200 text-slate-700 font-medium transition shadow-2xs hover:border-teal-300"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms (e.g., vomiting, scratching, ear odor, sneezing)..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-1 pb-1 sm:pb-0 scrollbar-none">
          {['All', ...Object.keys(categories || {})].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategoryTab(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategoryTab === cat
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Symptoms Grouped Section */}
      <div className="space-y-4 max-h-[340px] overflow-y-auto pr-1">
        {Object.keys(filteredCategories).length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="text-sm font-semibold text-slate-600">No matching symptoms found</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for broader terms like "itch", "vomit", or "redness".</p>
          </div>
        ) : (
          Object.entries(filteredCategories).map(([categoryName, symptoms]) => {
            const CatIcon = CATEGORY_ICONS[categoryName] || Activity;
            const categorySelectedCount = symptoms.filter((s) => selectedSymptoms.includes(s.id)).length;

            return (
              <div key={categoryName} className="bg-slate-50/70 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <CatIcon className="w-3.5 h-3.5 text-teal-600" />
                    <span>{categoryName}</span>
                  </div>
                  {categorySelectedCount > 0 && (
                    <span className="text-[11px] font-semibold text-teal-700 bg-teal-100/70 px-2 py-0.5 rounded-full">
                      {categorySelectedCount} chosen
                    </span>
                  )}
                </div>

                {/* Symptom Chips Grid */}
                <div className="flex flex-wrap gap-2">
                  {symptoms.map((symptom) => {
                    const isSelected = selectedSymptoms.includes(symptom.id);
                    return (
                      <button
                        key={symptom.id}
                        type="button"
                        onClick={() => onToggleSymptom(symptom.id)}
                        className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-left transition-all ${
                          isSelected
                            ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/30'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                        title={symptom.desc}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 transition ${
                          isSelected ? 'bg-white/20 text-white' : 'border border-slate-300 text-transparent group-hover:border-slate-400'
                        }`}>
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                        <span>{symptom.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Severity & Duration Slider Controls */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Severity Slider */}
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Clinical Severity Intensity</span>
            </label>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md border ${getSeverityColor()}`}>
              {severity}
            </span>
          </div>

          <div className="px-1">
            <input
              type="range"
              min="1"
              max="3"
              step="1"
              value={getSeveritySliderValue()}
              onChange={(e) => handleSliderChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 mt-1">
              <span className={severity === 'Mild' ? 'text-emerald-700 font-bold' : ''}>Mild (Alert)</span>
              <span className={severity === 'Moderate' ? 'text-amber-700 font-bold' : ''}>Moderate (Unwell)</span>
              <span className={severity === 'Severe' ? 'text-rose-700 font-bold' : ''}>Severe (Critical)</span>
            </div>
          </div>
        </div>

        {/* Duration Input */}
        <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-200/70">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>Symptom Duration</span>
            </label>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md">
              {durationDays} {durationDays === 1 ? 'day' : 'days'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="30"
              value={durationDays}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-teal-600"
            />
            <input
              type="number"
              min="1"
              max="60"
              value={durationDays}
              onChange={(e) => onDurationChange(Math.max(1, Number(e.target.value)))}
              className="w-16 px-2 py-1 text-xs text-center font-bold bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>Acute (&lt;3 days)</span>
            <span>Sub-acute (1-2 wk)</span>
            <span>Chronic (&gt;14 days)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
