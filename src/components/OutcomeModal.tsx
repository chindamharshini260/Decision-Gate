import React, { useState } from 'react';
import { BrainCircuit, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { api } from '../api.ts';
import { Proposal } from '../types.ts';

interface OutcomeModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const OutcomeModal: React.FC<OutcomeModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !proposal) return null;

  const [actualResult, setActualResult] = useState<'Successful' | 'Partially Successful' | 'Failed' | 'Cancelled'>('Partially Successful');
  const [whatHappened, setWhatHappened] = useState(
    'The AI Billing Assistant launched on the web portal. Routine charge inquiries were answered smoothly, but users grew impatient with the human escalation queue during peak Monday mornings.'
  );
  const [didPredictedRiskOccur, setDidPredictedRiskOccur] = useState(true);
  const [assumptionsCorrect, setAssumptionsCorrect] = useState(
    'FAQ containment was high (68%); clear boundaries prevented billing credits hallucinations.'
  );
  const [assumptionsWrong, setAssumptionsWrong] = useState(
    'Assumed human support agents would handle escalations within 3 minutes; actual wait time was 14 minutes.'
  );
  const [whatWorked, setWhatWorked] = useState('Read-only schema guards and invoice line-item breakdown.');
  const [whatFailed, setWhatFailed] = useState('Escalation handoff queue bottleneck under peak morning surges.');
  const [actualRootCause, setActualRootCause] = useState('Support team staffing was not synchronized with bot launch volume.');
  const [finalLesson, setFinalLesson] = useState(
    'AI assistants that rely on human escalation require dedicated support agent scheduling, not shared tier-2 pool.'
  );
  const [futureAdvice, setFutureAdvice] = useState(
    'Ensure reserved human capacity or dynamic throttling before launching customer-facing AI triage.'
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!whatHappened.trim() || !finalLesson.trim()) {
      setError('Please provide "What Happened" and the "Final Lesson".');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.recordOutcome(proposal.id, {
        actualResult,
        whatHappened,
        didPredictedRiskOccur,
        assumptionsCorrect,
        assumptionsWrong,
        whatWorked,
        whatFailed,
        actualRootCause,
        finalLesson,
        futureAdvice,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record outcome.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-150 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-gray-900">Record Real-World Initiative Outcome</h2>
              <p className="text-xs text-gray-500">The feedback loop: this result becomes a new experience retained in Hindsight.</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Final Initiative Result *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['Successful', 'Partially Successful', 'Failed', 'Cancelled'] as const).map((res) => (
                <button
                  type="button"
                  key={res}
                  onClick={() => setActualResult(res)}
                  className={`py-2 px-3 rounded-lg border font-semibold text-center transition-colors cursor-pointer ${
                    actualResult === res
                      ? res === 'Successful'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : res === 'Partially Successful'
                        ? 'bg-blue-50 text-blue-800 border-blue-300'
                        : 'bg-rose-50 text-rose-800 border-rose-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              What Happened in Reality? *
            </label>
            <textarea
              rows={3}
              value={whatHappened}
              onChange={(e) => setWhatHappened(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="font-semibold text-gray-800">Did the predicted historical risk occur?</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="riskOccurred"
                  checked={didPredictedRiskOccur}
                  onChange={() => setDidPredictedRiskOccur(true)}
                />
                <span className="font-medium text-gray-700">YES</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="riskOccurred"
                  checked={!didPredictedRiskOccur}
                  onChange={() => setDidPredictedRiskOccur(false)}
                />
                <span className="font-medium text-gray-700">NO</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Which Assumptions Were Correct?
              </label>
              <textarea
                rows={2}
                value={assumptionsCorrect}
                onChange={(e) => setAssumptionsCorrect(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Which Assumptions Were Wrong?
              </label>
              <textarea
                rows={2}
                value={assumptionsWrong}
                onChange={(e) => setAssumptionsWrong(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-emerald-800 mb-1">
                What Worked Well?
              </label>
              <input
                type="text"
                value={whatWorked}
                onChange={(e) => setWhatWorked(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-rose-800 mb-1">
                What Failed or Struggled?
              </label>
              <input
                type="text"
                value={whatFailed}
                onChange={(e) => setWhatFailed(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Actual Root Cause
            </label>
            <input
              type="text"
              value={actualRootCause}
              onChange={(e) => setActualRootCause(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-blue-900 mb-1">
              Final Lesson for Future Teams * (Retained into Hindsight)
            </label>
            <textarea
              rows={2}
              value={finalLesson}
              onChange={(e) => setFinalLesson(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-blue-300 bg-blue-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Advice for Future Similar Initiatives
            </label>
            <input
              type="text"
              value={futureAdvice}
              onChange={(e) => setFutureAdvice(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-[11px] text-gray-500">
              Saves to DB & calls Hindsight Retain so organizational memory grows.
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4" />
                {saving ? 'Closing Feedback Loop...' : 'Save & Retain in Memory'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
