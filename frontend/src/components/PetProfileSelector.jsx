import React from 'react';
import { Dog, Cat, Sparkles, Scale, Calendar, Award } from 'lucide-react';

const COMMON_BREEDS = {
  Dog: [
    "Mixed Breed / Indie", "Golden Retriever", "Labrador Retriever", "German Shepherd",
    "French Bulldog", "Pug", "Beagle", "Poodle", "Rottweiler", "Shih Tzu",
    "Siberian Husky", "Dachshund", "Cocker Spaniel", "Border Collie"
  ],
  Cat: [
    "Domestic Shorthair", "Persian Cat", "Siamese Cat", "Maine Coon", "Bengal Cat",
    "Ragdoll", "British Shorthair", "Scottish Fold", "Sphynx", "Russian Blue"
  ]
};

export default function PetProfileSelector({ profile, onChange }) {
  const isDog = profile.species === 'Dog';

  const handleSpeciesToggle = (spec) => {
    const defaultBreed = spec === 'Dog' ? 'Mixed Breed / Indie' : 'Domestic Shorthair';
    const defaultWeight = spec === 'Dog' ? 12.0 : 4.0;
    onChange({
      ...profile,
      species: spec,
      breed: defaultBreed,
      weight_kg: defaultWeight
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
            1
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Pet Patient Profile</h2>
            <p className="text-xs text-slate-500">Demographic baseline helps calibrate species-specific risk priors</p>
          </div>
        </div>

        {/* Species Switcher */}
        <div className="inline-flex p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => handleSpeciesToggle('Dog')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isDog
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Dog className="w-4 h-4" />
            <span>Canine (Dog)</span>
          </button>
          <button
            type="button"
            onClick={() => handleSpeciesToggle('Cat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isDog
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Cat className="w-4 h-4" />
            <span>Feline (Cat)</span>
          </button>
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Breed Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-teal-600" />
            <span>Breed / Lineage</span>
          </label>
          <div className="relative">
            <input
              type="text"
              list="breed-options"
              value={profile.breed}
              onChange={(e) => onChange({ ...profile, breed: e.target.value })}
              placeholder="e.g. Golden Retriever"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
            <datalist id="breed-options">
              {COMMON_BREEDS[profile.species]?.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Age in Months/Years */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Patient Age</span>
            </span>
            <span className="text-[11px] font-medium text-teal-700">
              {profile.age_months < 12
                ? `${profile.age_months} mo (Puppy/Kitten)`
                : `${(profile.age_months / 12).toFixed(1)} yrs (${profile.age_months} mo)`}
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="240"
              value={profile.age_months}
              onChange={(e) => onChange({ ...profile, age_months: Math.max(1, Number(e.target.value)) })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
            <span className="text-xs text-slate-500 font-medium px-2 py-2 bg-slate-100 rounded-lg">
              months
            </span>
          </div>
        </div>

        {/* Weight in kg */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Scale className="w-3.5 h-3.5 text-teal-600" />
              <span>Body Weight</span>
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              ~{(profile.weight_kg * 2.20462).toFixed(1)} lbs
            </span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              min="0.5"
              max="100"
              value={profile.weight_kg}
              onChange={(e) => onChange({ ...profile, weight_kg: Math.max(0.5, Number(e.target.value)) })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition"
            />
            <span className="text-xs text-slate-500 font-medium px-2.5 py-2 bg-slate-100 rounded-lg">
              kg
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
