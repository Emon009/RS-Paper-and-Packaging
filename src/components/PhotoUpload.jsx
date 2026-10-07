import React, { useState, useRef } from 'react';
import { Camera, Trash2, RefreshCw, User, Building2, CheckCircle2 } from 'lucide-react';
import { compressImage, formatFileSize } from '../utils/imageCompressor';
import { useLanguage } from '../i18n/LanguageContext';

export default function PhotoUpload({
  photo,
  onChange,
  type = 'customer', // 'customer' | 'supplier'
  label,
  className = ''
}) {
  const { t, lang } = useLanguage();
  const fileInputRef = useRef(null);
  const [compressing, setCompressing] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const isCustomer = type === 'customer';

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    setError('');
    setStats(null);

    try {
      // Auto compress the image to 400x400 JPEG at 75% quality
      const result = await compressImage(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.75,
        format: 'image/jpeg'
      });

      onChange(result.dataUrl);
      setStats({
        original: formatFileSize(result.originalSize),
        compressed: formatFileSize(result.compressedSize),
        saved: Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)
      });
    } catch (err) {
      console.error(err);
      setError(lang === 'bn' ? 'ছবি কমপ্রেস করতে ব্যর্থ হয়েছে' : 'Failed to compress image');
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    setStats(null);
    setError('');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}

      <div className="flex items-center gap-3">
        {/* Avatar Display / Click to Upload */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative group cursor-pointer shrink-0"
          title={lang === 'bn' ? 'ছবি আপলোড করতে ক্লিক করুন' : 'Click to upload photo'}
        >
          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 transition shadow-sm flex items-center justify-center bg-slate-100 ${
            photo
              ? 'border-emerald-500 group-hover:border-emerald-600'
              : (isCustomer ? 'border-teal-300 group-hover:border-teal-400' : 'border-indigo-300 group-hover:border-indigo-400')
          }`}>
            {photo ? (
              <img
                src={photo}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className={`flex flex-col items-center justify-center ${
                isCustomer ? 'text-teal-600' : 'text-indigo-600'
              }`}>
                {isCustomer ? <User className="w-8 h-8 opacity-60" /> : <Building2 className="w-8 h-8 opacity-60" />}
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
              <Camera className="w-5 h-5" />
            </div>

            {/* Spinner during compression */}
            {compressing && (
              <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center text-emerald-600">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          {/* Camera Badge Icon */}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white pointer-events-none">
            <Camera className="w-3 h-3" />
          </div>
        </div>

        {/* Info & Action Buttons */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={compressing}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm active:scale-95 text-white ${
                isCustomer ? 'bg-teal-600 hover:bg-teal-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {photo 
                ? (lang === 'bn' ? 'ছবি পরিবর্তন' : 'Change Photo') 
                : (lang === 'bn' ? 'ছবি নির্বাচন' : 'Upload Photo')}
            </button>

            {photo && (
              <button
                type="button"
                onClick={handleRemove}
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition active:scale-95 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>{lang === 'bn' ? 'মুছুন' : 'Remove'}</span>
              </button>
            )}
          </div>

          {/* Auto compression notification */}
          {stats && (
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
              <span>
                {lang === 'bn'
                  ? `অটো কমপ্রেসড: ${stats.original} ➔ ${stats.compressed} (${stats.saved}% সেভ)`
                  : `Auto compressed: ${stats.original} ➔ ${stats.compressed} (${stats.saved}% saved)`}
              </span>
            </p>
          )}

          {!stats && !photo && (
            <p className="text-[11px] text-slate-400">
              {lang === 'bn'
                ? 'মোবাইল ক্যামেরা বা গ্যালারি থেকে যেকোনো ছবি দিলে তা অটো কমপ্রেস হবে।'
                : 'Upload from phone camera or gallery — auto compresses under 50KB.'}
            </p>
          )}

          {error && (
            <p className="text-[11px] text-rose-600 font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}
