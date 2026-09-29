import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  BrainCircuit, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Key,
  Trash2
} from 'lucide-react';
import { api } from '../api.ts';
import { SystemStatus, AuditLog } from '../types.ts';

interface SettingsViewProps {
  status: SystemStatus | null;
  onRefreshStatus: () => void;
  onOpenDemoModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  status,
  onRefreshStatus,
  onOpenDemoModal,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [bankId, setBankId] = useState(status?.hindsight?.bankId || 'decision-gate-memory');
  const [baseUrl, setBaseUrl] = useState(status?.hindsight?.baseUrl || 'https://api.hindsight.vectorize.io');
  const [savingKey, setSavingKey] = useState(false);
  const [keySuccess, setKeySuccess] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoadingLogs(true);
        const logs = await api.getAuditLogs(30);
        setAuditLogs(logs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingLogs(false);
      }
    }
    loadLogs();
  }, []);

  const handleSaveHindsight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setKeyError('API Key is required.');
      return;
    }

    try {
      setSavingKey(true);
      setKeyError(null);
      await api.updateHindsight(apiKey, bankId, baseUrl);
      setKeySuccess(true);
      onRefreshStatus();
      setTimeout(() => setKeySuccess(false), 3000);
    } catch (err: any) {
      setKeyError(err.message || 'Failed to update credentials.');
    } finally {
      setSavingKey(false);
    }
  };

  const isHindsightAvailable = status?.hindsight?.isAvailable;
  const isPostgresConnected = status?.database?.postgresConnected;

  return (
    <div className="space-y-6 py-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-700" />
          <h1 className="text-xl font-bold text-gray-900">System Architecture & Audit Configuration</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Review database persistence, configure Hindsight organizational memory credentials, and inspect the auditable decision trail.
        </p>
      </div>

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Hindsight Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Memory Layer</span>
            <BrainCircuit className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Hindsight AI Memory</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isHindsightAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span className="text-xs font-semibold text-gray-700">
                {isHindsightAvailable ? 'Connected & Active' : 'Not Configured (Requires Key)'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
            <div>Bank: <strong className="text-gray-800">{status?.hindsight?.bankId || 'decision-gate-memory'}</strong></div>
            <div>Base URL: <span className="font-mono text-gray-600">{status?.hindsight?.baseUrl}</span></div>
          </div>
        </div>

        {/* Database Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Structured Data</span>
            <Database className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Relational Database</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2.5 h-2.5 rounded-full ${isPostgresConnected ? 'bg-emerald-500' : 'bg-blue-500'}`} />
              <span className="text-xs font-semibold text-gray-700">
                {status?.database?.storageMode || 'Active'}
              </span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
            <div>PostgreSQL: <strong className={isPostgresConnected ? 'text-emerald-700' : 'text-gray-600'}>{isPostgresConnected ? 'Connected' : 'Offline (Local Persistence)'}</strong></div>
            <div>Prisma Schema: <span className="text-gray-800 font-mono">prisma/schema.prisma</span></div>
          </div>
        </div>

        {/* Gemini AI Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Reasoning Layer</span>
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Gemini 3.8 Flash</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-semibold text-gray-700">Active (Server-Side)</span>
            </div>
          </div>
          <div className="text-[11px] text-gray-500 space-y-1 pt-2 border-t border-gray-100">
            <div>Extraction: <strong className="text-gray-800">Structured Schemas</strong></div>
            <div>Comparison: <strong className="text-gray-800">Precedent Engine</strong></div>
          </div>
        </div>
      </div>

      {/* Hindsight API Configuration Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-blue-600" />
              <span>Configure Hindsight Memory Bank Credentials</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your official Vectorize Hindsight API key to enable genuine cloud long-term memory operations.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveHindsight} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">
                HINDSIGHT_API_KEY *
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="vctz_..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                HINDSIGHT_BANK_ID
              </label>
              <input
                type="text"
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                placeholder="decision-gate-memory"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">
              HINDSIGHT_BASE_URL
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.hindsight.vectorize.io"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {keySuccess && (
            <div className="p-2.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Hindsight client credentials updated and verified successfully!</span>
            </div>
          )}

          {keyError && (
            <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {keyError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-gray-400">
              Never exposed to the client bundle; kept securely on backend server.
            </span>
            <button
              type="submit"
              disabled={savingKey}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              {savingKey ? 'Verifying...' : 'Save Hindsight Credentials'}
            </button>
          </div>
        </form>
      </div>

      {/* Demo Controls Callout */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-gray-900">Demonstration Precedents & Testing Data</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Load the official "Customer Support Chatbot" failure case and "Self-Service Cloud Optimizer" to test precedent recall immediately.
          </p>
        </div>
        <button
          onClick={onOpenDemoModal}
          className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 rounded-lg font-semibold text-xs shadow-2xs cursor-pointer shrink-0"
        >
          Manage Test Data
        </button>
      </div>

      {/* Audit Log Table (Prompt Section 30) */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-gray-600" />
              <span>Auditable Decision Trail</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Immutable log of every experience retained, precedent recalled, and decision made.
            </p>
          </div>
          <button
            onClick={async () => {
              const logs = await api.getAuditLogs(30);
              setAuditLogs(logs);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {loadingLogs ? (
          <p className="text-xs text-gray-400 py-4 text-center">Loading audit logs...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No audit entries recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-slate-50 text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Timestamp</th>
                  <th className="px-3 py-2 text-left font-semibold">Action</th>
                  <th className="px-3 py-2 text-left font-semibold">Entity</th>
                  <th className="px-3 py-2 text-left font-semibold">Entity ID</th>
                  <th className="px-3 py-2 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {log.timestamp.slice(0, 19).replace('T', ' ')}
                    </td>
                    <td className="px-3 py-2 font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="px-3 py-2 font-medium">{log.entityType}</td>
                    <td className="px-3 py-2 font-mono text-gray-500 whitespace-nowrap">
                      {log.entityId.slice(0, 8)}...
                    </td>
                    <td className="px-3 py-2 text-gray-600 max-w-xs truncate" title={log.details}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
