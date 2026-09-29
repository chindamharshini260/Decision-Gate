import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  PlusCircle, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  ArrowRight,
  ChevronRight,
  Database
} from 'lucide-react';
import { HistoricalProject, HistoricalExperience } from '../types.ts';

interface HistoricalProjectsViewProps {
  projects: (HistoricalProject & { experiences: HistoricalExperience[] })[];
  onNavigate: (tab: string, entityId?: string) => void;
  onRetrySync: (experienceId: string) => Promise<void>;
}

export const HistoricalProjectsView: React.FC<HistoricalProjectsViewProps> = ({
  projects,
  onNavigate,
  onRetrySync,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filtered = projects.filter((proj) => {
    const matchesStatus = statusFilter === 'ALL' || proj.status === statusFilter;
    const exp = proj.experiences?.[0];
    const textCorpus = `${proj.name} ${proj.projectType} ${proj.problemGoal} ${exp?.whatWasAttempted || ''} ${exp?.lessonsLearned || ''} ${exp?.rootCause || ''}`.toLowerCase();
    const matchesSearch = textCorpus.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleRetry = async (experienceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setRetryingId(experienceId);
      await onRetrySync(experienceId);
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Historical Organizational Initiatives</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Browse and query historical projects, postmortems, decisions, and outcomes preserved in organizational memory.
          </p>
        </div>
        <button
          onClick={() => onNavigate('add-experience')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Capture New Experience
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects, approaches, failure causes, lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Outcomes ({projects.length})</option>
            <option value="Successful">Successful</option>
            <option value="Partially Successful">Partially Successful</option>
            <option value="Failed">Failed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* List of Historical Projects */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <History className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900">
            {projects.length === 0 ? 'No historical organizational data available.' : 'No matching historical projects found.'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {projects.length === 0 
              ? 'Add previous initiatives or postmortems to provide precedent intelligence for upcoming proposals.'
              : 'Try clearing your search query or changing the outcome filter.'}
          </p>
          {projects.length === 0 && (
            <button
              onClick={() => onNavigate('add-experience')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Capture First Experience
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((proj) => {
            const exp = proj.experiences?.[0];
            const isSyncSuccess = exp?.hindsightSyncStatus === 'SYNCED';
            const isSyncFailed = exp?.hindsightSyncStatus === 'FAILED';

            return (
              <div
                key={proj.id}
                onClick={() => onNavigate('historical-detail', proj.id)}
                className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-5 shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-gray-900 hover:text-blue-600">
                        {proj.name}
                      </h2>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                        proj.status === 'Successful' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : proj.status === 'Partially Successful'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {proj.status}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                        {proj.projectType}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 leading-snug">
                      <strong className="text-gray-900">Attempted:</strong> {exp?.whatWasAttempted || proj.problemGoal}
                    </p>

                    {exp?.whatFailed && (
                      <p className="text-sm text-rose-800 bg-rose-50/70 p-2.5 rounded border border-rose-100">
                        <strong className="font-semibold text-rose-900">What Failed & Root Cause:</strong> {exp.whatFailed} {exp.rootCause ? `— (${exp.rootCause})` : ''}
                      </p>
                    )}

                    {exp?.lessonsLearned && (
                      <p className="text-sm text-slate-800 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <strong className="font-semibold text-slate-900">Documented Lesson:</strong> {exp.lessonsLearned}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        Source: {exp?.source || 'Postmortem / Retrospective'}
                      </span>
                      {proj.startDate || proj.endDate ? (
                        <span>Timeline: {proj.startDate || ''} {proj.endDate ? `to ${proj.endDate}` : ''}</span>
                      ) : (
                        <span className="italic text-gray-400">Historical dates not specified in source record</span>
                      )}
                    </div>
                  </div>

                  {/* Hindsight Memory Sync Badge & Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="flex items-center gap-2">
                      {isSyncSuccess ? (
                        <div 
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs bg-emerald-50 text-emerald-800 border border-emerald-200"
                          title={`Hindsight Memory ID: ${exp?.hindsightMemoryId || 'Retained'}`}
                        >
                          <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
                          <span>In Hindsight</span>
                        </div>
                      ) : isSyncFailed ? (
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 text-amber-800 border border-amber-200"
                            title={exp?.hindsightSyncError || 'Hindsight synchronization failed'}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Memory Sync Failed</span>
                          </span>
                          {exp?.id && (
                            <button
                              onClick={(e) => handleRetry(exp.id, e)}
                              disabled={retryingId === exp.id}
                              className="text-xs px-2 py-0.5 rounded border border-gray-300 hover:bg-gray-100 text-gray-700 flex items-center gap-1 cursor-pointer"
                              title="Retry syncing to Hindsight"
                            >
                              <RefreshCw className={`w-3 h-3 ${retryingId === exp.id ? 'animate-spin' : ''}`} />
                              Retry
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-slate-50 text-slate-600 border border-slate-200">
                          <Database className="w-3.5 h-3.5" />
                          <span>Saved in DB</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => onNavigate('historical-detail', proj.id)}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View Full Record <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
