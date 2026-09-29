import React, { useState } from 'react';
import { Sparkles, Trash2, X, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { api } from '../api.ts';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleLoadDemo = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      const res = await api.loadDemoData();
      setMessage(res.message);
      onRefresh();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(`Error loading demo data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = async () => {
    try {
      setLoading(true);
      setMessage(null);
      setError(null);
      setShowConfirmReset(false);
      const res = await api.clearAllData();
      setMessage(res.message);
      onRefresh();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e: any) {
      setError(`Error clearing data: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">Demonstration Precedents</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed">
          Decision Gate starts with an empty organizational database as required.
          You can load the benchmark user-story data to demonstrate how the Precedent Engine detects recurring failure conditions.
        </p>

        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs space-y-1 text-blue-950">
          <span className="font-bold block">Included Benchmark Case:</span>
          <div>• <strong>Customer Support Chatbot:</strong> Discontinued postmortem where an AI assistant failed on complex billing inquiries due to lack of human escalation.</div>
          <div>• <strong>Cloud Cost Optimizer:</strong> Successful internal tooling initiative.</div>
        </div>

        {message && (
          <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={handleLoadDemo}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <History className="w-4 h-4" />
            {loading ? 'Processing...' : 'Load Benchmark Historical Precedents'}
          </button>

          {showConfirmReset ? (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
              <p className="text-xs text-rose-800 font-medium">Are you sure? This removes all proposals and experiences.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearData}
                  disabled={loading}
                  className="flex-1 py-1.5 px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded cursor-pointer"
                >
                  Yes, Reset Everything
                </button>
                <button
                  onClick={() => setShowConfirmReset(false)}
                  disabled={loading}
                  className="py-1.5 px-3 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirmReset(true)}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white border border-rose-300 hover:bg-rose-50 disabled:opacity-50 text-rose-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              Reset Database to Clean Empty State
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
