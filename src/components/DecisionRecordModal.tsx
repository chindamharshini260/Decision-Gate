import React, { useState } from 'react';
import { BookmarkCheck, X, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { api } from '../api.ts';
import { Proposal } from '../types.ts';

interface DecisionRecordModalProps {
  proposal: Proposal | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const DecisionRecordModal: React.FC<DecisionRecordModalProps> = ({
  proposal,
  isOpen,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !proposal) return null;

  const [decision, setDecision] = useState<'Approved' | 'Rejected' | 'More Information Required' | 'Deferred'>(
    (proposal.decisionRecord?.decision as any) || 'Approved'
  );
  const [decisionMaker, setDecisionMaker] = useState(proposal.decisionRecord?.decisionMaker || 'Alex Morgan, VP Operations');
  const [reason, setReason] = useState(
    proposal.decisionRecord?.reason ||
    'Proposal adequately incorporates historical billing lessons with a mandatory escalation workflow.'
  );
  const [conditions, setConditions] = useState(
    proposal.decisionRecord?.conditions ||
    'Approval is strictly contingent on defining complex billing triggers before live launch.'
  );
  const [additionalNotes, setAdditionalNotes] = useState(proposal.decisionRecord?.additionalNotes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionMaker.trim() || !reason.trim()) {
      setError('Decision maker and Reason are required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await api.recordDecision(
        proposal.id,
        decision,
        decisionMaker,
        reason,
        conditions,
        additionalNotes
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record decision.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BookmarkCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Record Human Decision</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-500">
          Proposal: <strong className="text-gray-900">{proposal.title}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Decision Choice *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Approved', 'Rejected', 'More Information Required', 'Deferred'] as const).map((opt) => (
                <button
                  type="button"
                  key={opt}
                  onClick={() => setDecision(opt)}
                  className={`py-2 px-3 rounded-lg border font-semibold text-left transition-colors cursor-pointer ${
                    decision === opt
                      ? opt === 'Approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : opt === 'Rejected'
                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                        : 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Decision Maker Name & Title *
            </label>
            <input
              type="text"
              value={decisionMaker}
              onChange={(e) => setDecisionMaker(e.target.value)}
              placeholder="e.g. Alex Morgan, VP Operations"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Justification / Reason (Grounded in Precedent Report) *
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain how historical precedents informed this decision..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Contingent Conditions / Safeguards (Optional)
            </label>
            <input
              type="text"
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              placeholder="e.g. Tier-2 handoff SLA must be < 60 seconds; pilot limited to 500 users"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              Additional Notes
            </label>
            <input
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Internal tracking notes"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              {saving ? 'Recording...' : 'Record Human Decision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
