import React from 'react';
import { GrievanceStatus, Language } from '../types';
import { translations } from '../i18n/translations';
import { CheckCircle2, Clock, Wrench, FileCheck, AlertCircle } from 'lucide-react';

interface Props {
  status: GrievanceStatus;
  lang: Language;
  history?: Array<{ status: GrievanceStatus; note: string; timestamp: string; updatedBy: string }>;
}

export const GrievanceProgressBar: React.FC<Props> = ({ status, lang, history }) => {
  const t = translations[lang];

  const steps: { key: GrievanceStatus; label: string; icon: any; color: string }[] = [
    { key: 'submitted', label: t.statusSubmitted, icon: FileCheck, color: 'text-amber-600 bg-amber-50 border-amber-300' },
    { key: 'under_review', label: t.statusUnderReview, icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-300' },
    { key: 'in_progress', label: t.statusInProgress, icon: Wrench, color: 'text-purple-600 bg-purple-50 border-purple-300' },
    { key: 'resolved', label: t.statusResolved, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-300' },
  ];

  const stepOrder: Record<GrievanceStatus, number> = {
    submitted: 0,
    under_review: 1,
    in_progress: 2,
    resolved: 3,
  };

  const currentIdx = stepOrder[status] ?? 0;

  return (
    <div id="grievance-progress-container" className="w-full bg-[#FAFAFA] border border-[#E0E0E0] rounded-lg p-4 sm:p-5 my-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-xs font-bold tracking-widest uppercase text-[#004D40] flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-[#004D40]" />
          {t.timeline}
        </h4>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border ${
          status === 'resolved'
            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
            : status === 'in_progress'
            ? 'bg-purple-100 text-purple-900 border-purple-300'
            : status === 'under_review'
            ? 'bg-blue-100 text-blue-900 border-blue-300'
            : 'bg-amber-100 text-amber-900 border-amber-300'
        }`}>
          {steps[currentIdx]?.label}
        </span>
      </div>

      {/* Visual Stepper */}
      <div className="relative flex items-center justify-between mb-4">
        {/* Connecting line */}
        <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-1 bg-[#E0E0E0] -z-0">
          <div
            className="h-full bg-[#004D40] transition-all duration-500 ease-out"
            style={{ width: `${(currentIdx / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx <= currentIdx;
          const isCurrent = idx === currentIdx;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isDone
                    ? idx === 3
                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                      : 'bg-[#004D40] border-[#004D40] text-white shadow-xs'
                    : 'bg-white border-gray-300 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-[#E0F2F1] scale-110' : ''}`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className={`text-[10px] uppercase tracking-wider font-bold mt-1.5 text-center max-w-[80px] leading-tight ${
                isCurrent ? 'text-[#004D40]' : isDone ? 'text-gray-700' : 'text-gray-400'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* History notes if any */}
      {history && history.length > 0 && (
        <div className="mt-4 pt-3 border-t border-[#E0E0E0] text-xs space-y-2">
          <p className="font-bold uppercase tracking-wider text-[#004D40] text-[10px] mb-1">{t.officialUpdates}:</p>
          {history.map((h, i) => (
            <div key={i} className="flex items-start gap-2 bg-white p-2.5 rounded-md border border-[#E0E0E0]">
              <div className="w-2 h-2 rounded-full bg-[#004D40] mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between text-[10px] text-gray-500">
                  <span className="font-bold text-[#1A1A1A]">{h.updatedBy || 'Authority'}</span>
                  <span>{new Date(h.timestamp).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-gray-800 mt-0.5">{h.note}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
