import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  X,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles
} from 'lucide-react';

// Generates synthetic clinical test lesion canvas data URIs so users can test immediately
const SAMPLE_LESIONS = [
  {
    id: "hot_spot",
    label: "Sample 1: Inflammatory Erythema / Hot Spot",
    desc: "Intense focal redness with moist exudate",
    color: "#e11d48", // deep red erythema
    secondary: "#fecdd3"
  },
  {
    id: "ringworm",
    label: "Sample 2: Circular Alopecia / Ringworm",
    desc: "Ring pattern with flaky peripheral scaling",
    color: "#b45309", // brownish flaky ring
    secondary: "#fde68a"
  },
  {
    id: "eye_discharge",
    label: "Sample 3: Ocular Conjunctivitis Exudate",
    desc: "Periorbital erythema and mucoid discharge",
    color: "#0284c7",
    secondary: "#bae6fd"
  }
];

function generateSampleImageDataUrl(primaryColor, secondaryColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Background skin tone
  ctx.fillStyle = '#fce7dc';
  ctx.fillRect(0, 0, 256, 256);

  // Hair follicle textures
  ctx.strokeStyle = '#d79b7d';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 12, y + 8);
    ctx.stroke();
  }

  // Central lesion ring / erythema
  const grad = ctx.createRadialGradient(128, 128, 15, 128, 128, 90);
  grad.addColorStop(0, primaryColor);
  grad.addColorStop(0.5, secondaryColor);
  grad.addColorStop(1, 'rgba(252, 231, 220, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(128, 128, 90, 0, 2 * Math.PI);
  ctx.fill();

  // Fine crusting / papules
  ctx.fillStyle = '#991b1b';
  for (let i = 0; i < 25; i++) {
    const r = Math.random() * 55;
    const theta = Math.random() * 2 * Math.PI;
    const cx = 128 + r * Math.cos(theta);
    const cy = 128 + r * Math.sin(theta);
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}

export default function ImageUploader({
  imagePreview,
  onImageSelected,
  onImageCleared
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelected({
        file,
        previewUrl: e.target.result,
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleClick = (sample) => {
    const dataUrl = generateSampleImageDataUrl(sample.color, sample.secondary);
    onImageSelected({
      file: null,
      previewUrl: dataUrl,
      name: `${sample.id}_clinical_sample.jpg`,
      size: '34.2 KB (Synthetic Preset)'
    });
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 flex items-center justify-center font-bold">
            3
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Visible Lesion Photo Analysis</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                Optional CNN Vision Input
              </span>
            </h2>
            <p className="text-xs text-slate-500">Upload skin rashes, circular bald patches, ear discharge, or ocular inflammation</p>
          </div>
        </div>

        {imagePreview && (
          <button
            type="button"
            onClick={onImageCleared}
            className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      {/* Main Dropzone / Preview */}
      {!imagePreview ? (
        <div>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? 'border-teal-500 bg-teal-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-teal-400 hover:bg-slate-50/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-2xs group-hover:scale-105 transition">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                Drag and drop pet symptom photo here
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                or <span className="text-teal-600 underline font-semibold">browse local files</span> (PNG, JPG, WEBP up to 10MB)
              </p>
            </div>

            <div className="inline-flex items-center gap-2 text-[11px] text-slate-400 bg-slate-100/80 px-3 py-1 rounded-full mt-1">
              <Camera className="w-3 h-3 text-teal-600" />
              <span>For best results, part the pet's fur and photograph under bright natural light</span>
            </div>
          </div>

          {/* Quick Preset Clinical Samples */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>No pet photo handy? Try a synthetic clinical sample:</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {SAMPLE_LESIONS.map((samp) => (
                <button
                  key={samp.id}
                  type="button"
                  onClick={() => handleSampleClick(samp)}
                  className="flex items-center gap-2 p-2 rounded-xl text-left border border-slate-200 hover:border-teal-300 hover:bg-teal-50/50 transition group"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex-shrink-0 shadow-2xs border border-black/10"
                    style={{
                      background: `radial-gradient(circle, ${samp.color} 30%, ${samp.secondary} 80%)`
                    }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-teal-800">
                      {samp.label.split(':')[1] || samp.label}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{samp.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Image Preview State */
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative w-36 h-36 rounded-xl overflow-hidden shadow-sm border border-slate-200 bg-black flex-shrink-0">
            <img
              src={imagePreview.previewUrl}
              alt="Symptom preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 backdrop-blur-xs">
              <Eye className="w-3 h-3" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-teal-700 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Visual input ready for PyTorch MobileNetV3 inspection</span>
            </div>
            <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-sm">
              {imagePreview.name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{imagePreview.size}</p>

            <div className="flex items-center justify-center sm:justify-start gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition"
              >
                Replace Photo
              </button>
              <button
                type="button"
                onClick={onImageCleared}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
              >
                Remove
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </div>
        </div>
      )}
    </div>
  );
}
