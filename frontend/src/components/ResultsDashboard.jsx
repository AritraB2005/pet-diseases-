import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Activity,
  FileText,
  Printer,
  Sparkles,
  Layers,
  Camera
} from 'lucide-react';

export default function ResultsDashboard({ result, onReset }) {
  if (!result || !result.top_predictions) return null;

  const isEmergency = result.overall_urgency === 'High';
  const isModerate = result.overall_urgency === 'Moderate';

  const getUrgencyBadgeConfig = (tier) => {
    switch (tier) {
      case 'High':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badgeBg: 'bg-rose-600 text-white',
          barColor: 'from-rose-500 to-red-600',
          icon: AlertOctagon,
          label: 'High / Emergency Care'
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badgeBg: 'bg-amber-500 text-white',
          barColor: 'from-amber-400 to-amber-600',
          icon: Clock,
          label: 'Moderate / Schedule Vet Visit'
        };
      default:
        return {
          bg: 'bg-teal-50 border-teal-200 text-teal-800',
          badgeBg: 'bg-teal-600 text-white',
          barColor: 'from-teal-400 to-teal-600',
          icon: CheckCircle2,
          label: 'Low / Monitor at Home'
        };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Urgency Summary Banner */}
      <div
        className={`rounded-2xl p-5 border shadow-sm transition-all ${
          isEmergency
            ? 'bg-rose-50 border-rose-300 text-rose-950 ring-2 ring-rose-500/20'
            : isModerate
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-teal-50 border-teal-300 text-teal-950'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span
              className={`p-2.5 rounded-xl text-white flex-shrink-0 shadow-sm ${
                isEmergency ? 'bg-rose-600 animate-pulse-glow' : isModerate ? 'bg-amber-500' : 'bg-teal-600'
              }`}
            >
              {isEmergency ? (
                <AlertOctagon className="w-6 h-6" />
              ) : isModerate ? (
                <Clock className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider opacity-75">
                  Triage Urgency Status
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    isEmergency
                      ? 'bg-rose-200 text-rose-900'
                      : isModerate
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-teal-200 text-teal-900'
                  }`}
                >
                  {result.overall_urgency_badge}
                </span>
              </div>
              <h3 className="text-lg font-extrabold mt-0.5">
                {isEmergency
                  ? 'Urgent Medical Attention Required'
                  : isModerate
                  ? 'Professional Veterinary Consult Recommended'
                  : 'Low Immediate Clinical Risk - Continue Monitoring'}
              </h3>
              <p className="text-xs opacity-85 mt-1 max-w-2xl leading-relaxed">
                {isEmergency
                  ? 'Patient presents clinical markers congruent with potentially acute systemic decompensation. Please contact or transport pet to an emergency 24/7 veterinary clinic.'
                  : isModerate
                  ? 'Symptoms indicate a secondary infection, dermatological irritation, or gastrointestinal condition that warrants a licensed vet evaluation within 24-48 hours.'
                  : 'Symptoms appear mild or localized. Maintain close observation and practice recommended supportive home care. Seek a vet if symptoms persist or escalate.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto flex-shrink-0">
            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 transition shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onReset}
              type="button"
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition shadow-2xs"
            >
              <span>New Triage Assessment</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Biomarkers Card (if image was processed) */}
      {result.visual_analysis && result.visual_analysis.success && (
        <div className="bg-white rounded-2xl p-5 border border-teal-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-teal-50 text-teal-600 rounded-lg">
                <Camera className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  PyTorch MobileNetV3 Visual Lesion Biometrics
                </h4>
                <p className="text-xs text-slate-500">Extracted cutaneous markers from uploaded photo</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
              Vision Multi-modal Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mb-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Erythema Severity Index</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {result.visual_analysis.biomarkers?.erythema_index ?? '--'}%
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, result.visual_analysis.biomarkers?.erythema_index || 0)}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Texture / Crusting Roughness</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {result.visual_analysis.biomarkers?.texture_roughness ?? '--'}%
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (result.visual_analysis.biomarkers?.texture_roughness || 0) * 2)}%` }}
                />
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500 font-medium">Alopecia / Asymmetry Score</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {result.visual_analysis.biomarkers?.patch_asymmetry ?? '--'}%
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-teal-500 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (result.visual_analysis.biomarkers?.patch_asymmetry || 0) * 2.5)}%` }}
                />
              </div>
            </div>
          </div>

          {result.visual_analysis.visual_findings && (
            <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100 flex flex-wrap gap-2 items-center text-xs text-slate-700">
              <span className="font-semibold text-slate-900 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Detected Visual Findings:
              </span>
              {result.visual_analysis.visual_findings.map((f, i) => (
                <span key={i} className="px-2 py-0.5 bg-white rounded-md border border-slate-200 font-medium text-slate-700">
                  {f}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Section Title */}
      <div>
        <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <span>Top 3 Differential Diagnostic Predictions</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            Ranked by XGBoost Multi-Class Probability
          </span>
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Calculated by synthesizing patient demographic priors, reported symptoms, and image biometrics
        </p>
      </div>

      {/* Top 3 Predicted Cards */}
      <div className="grid grid-cols-1 gap-5">
        {result.top_predictions.map((pred, index) => {
          const config = getUrgencyBadgeConfig(pred.urgency_tier);
          const UrgencyIcon = config.icon;

          return (
            <div
              key={pred.condition_name}
              className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm transition hover:shadow-md relative overflow-hidden"
            >
              {/* Top Accent Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.barColor}`}
              />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                      <span>{pred.condition_name}</span>
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${config.bg}`}
                      >
                        <UrgencyIcon className="w-3.5 h-3.5" />
                        <span>{pred.urgency_badge}</span>
                      </span>

                      {pred.visual_match_pct !== null && (
                        <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Multi-modal (Symptom: {pred.symptom_match_pct}% | Vision: {pred.visual_match_pct}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Confidence Bar & Percentage */}
                <div className="w-full md:w-56 flex-shrink-0">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-semibold text-slate-600">Model Confidence</span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {pred.confidence_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${config.barColor} transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max(5, pred.confidence_score)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Clinical Match Explanation */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-4 text-xs leading-relaxed">
                <div className="font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>Why these symptoms match:</span>
                </div>
                <p className="text-slate-600 font-normal">
                  {pred.why_matches}
                </p>
              </div>

              {/* Recommended Next Steps */}
              <div>
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                  <span>Recommended Action Plan & Next Steps:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {pred.recommended_steps.map((step, sIdx) => (
                    <li
                      key={sIdx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-teal-50/40 border border-teal-100/60 text-slate-700"
                    >
                      <span className="w-4 h-4 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {sIdx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
