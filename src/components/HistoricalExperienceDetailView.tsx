import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  History, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText, 
  Calendar, 
  ShieldCheck,
  Tag,
  Building,
  ExternalLink
} from 'lucide-react';
import { api } from '../api.ts';
import { HistoricalProject, HistoricalExperience } from '../types.ts';

interface HistoricalExperienceDetailViewProps {
  projectId: string;
  onNavigate: (tab: string, entityId?: string) => void;
  onRefresh: () => void;
}

export const HistoricalExperienceDetailView: React.FC<HistoricalExperienceDetailViewProps> = ({
  projectId,
  onNavigate,
  onRefresh,
}) => {
  const [project, setProject] = useState<(HistoricalProject & { experiences: HistoricalExperience[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingSync, setRetryingSync] = useState(false);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getHistoricalProjectById(projectId);
        setProject(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load project details.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const exp = project?.experiences?.[0];

  const handleRetryHindsight = async () => {
    if (!exp) return;
    try {
      setRetryingSync(true);
      setSyncErrorMessage(null);
      await api.retryHindsightSync(exp.id);
      const updated = await api.getHistoricalProjectById(projectId);
      setProject(updated);
      onRefresh();
    } catch (e: any) {
      setSyncErrorMessage(`Sync retry failed: ${e.message}`);
    } finally {
      setRetryingSync(false);
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm">Loading historical precedent record...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="py-12 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <h3 className="text-base font-bold text-gray-900">Record Not Found</h3>
        <p className="text-sm text-gray-500">{error || 'This historical project record could not be located.'}</p>
        <button
          onClick={() => onNavigate('historical-projects')}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded font-medium cursor-pointer"
        >
          Return to Past Initiatives
        </button>
      </div>
    );
  }

  const isHindsightSynced = exp?.hindsightSyncStatus === 'SYNCED';

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Back button */}
      <div>
        <button
          onClick={() => onNavigate('historical-projects')}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to past initiatives
        </button>

        {/* Title Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-slate-100 text-slate-700">
                  {project.projectType}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                  project.status === 'Successful' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : project.status === 'Partially Successful'
                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {project.status}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-gray-900 mt-2 tracking-tight">
                {project.name}
              </h1>
              {project.department && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                  <Building className="w-3.5 h-3.5" />
                  <span>{project.department.name} ({project.department.code})</span>
                </div>
              )}
            </div>

            {/* Hindsight Status Tag */}
            <div className="flex sm:flex-col items-center sm:items-end gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                isHindsightSynced 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <BrainCircuit className="w-4 h-4 text-emerald-600" />
                <span>Hindsight: {exp?.hindsightSyncStatus || 'PENDING'}</span>
              </div>
              {!isHindsightSynced && exp?.id && (
                <button
                  onClick={handleRetryHindsight}
                  disabled={retryingSync}
                  className="text-xs px-2.5 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded flex items-center gap-1 font-medium cursor-pointer shadow-2xs"
                >
                  <RefreshCw className={`w-3 h-3 ${retryingSync ? 'animate-spin' : ''}`} />
                  Retry Sync
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs text-gray-500">
            <div>
              <span className="text-gray-400 block">Database ID:</span>
              <span className="font-mono text-gray-700">{project.id.slice(0, 13)}...</span>
            </div>
            <div>
              <span className="text-gray-400 block">Timeline:</span>
              <span className="text-gray-700">
                {project.startDate || project.endDate 
                  ? `${project.startDate || ''} ${project.endDate ? `to ${project.endDate}` : ''}`.trim() 
                  : 'Historical dates not specified in source record'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block">Source Attribution:</span>
              <span className="text-gray-700">{exp?.source || 'Postmortem'}</span>
            </div>
            <div>
              <span className="text-gray-400 block">Hindsight Memory ID:</span>
              <span className="font-mono text-gray-700">{exp?.hindsightMemoryId || 'Local Storage Only'}</span>
            </div>
          </div>

          {syncErrorMessage && (
            <div className="mt-4 p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
              <span>{syncErrorMessage}</span>
              <button 
                onClick={() => setSyncErrorMessage(null)} 
                className="text-amber-700 hover:text-amber-900 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Narrative Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        {/* Core Lesson Highlight */}
        {exp?.lessonsLearned && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Preserved Organizational Lesson
            </span>
            <p className="text-base font-semibold text-blue-950 leading-relaxed">
              "{exp.lessonsLearned}"
            </p>
          </div>
        )}

        {/* Problem and Attempt */}
        <div className="space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Problem / Goal</h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {project.problemGoal}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">What Was Attempted</h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {exp?.whatWasAttempted || 'No attempt description recorded.'}
            </p>
          </div>

          {exp?.approachUsed && (
            <div>
              <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">Approach Used</h3>
              <p className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
                {exp.approachUsed}
              </p>
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-1">What Actually Happened</h3>
            <p className="text-sm text-gray-800 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-100">
              {exp?.whatHappened || 'Execution details not recorded.'}
            </p>
          </div>
        </div>

        {/* What Worked vs What Failed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">What Worked</h4>
            <p className="text-sm text-emerald-950 leading-relaxed">
              {exp?.whatWorked || 'No successful elements explicitly highlighted.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-1">
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">What Failed & Friction Points</h4>
            <p className="text-sm text-rose-950 leading-relaxed">
              {exp?.whatFailed || 'No specific failure points detailed.'}
            </p>
          </div>
        </div>

        {/* Root Cause & Failure Trigger */}
        {(exp?.whyItFailed || exp?.rootCause) && (
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Failure Analysis</h4>
            {exp.whyItFailed && (
              <p className="text-sm text-amber-950">
                <strong className="font-semibold">Trigger:</strong> {exp.whyItFailed}
              </p>
            )}
            {exp.rootCause && (
              <p className="text-sm text-amber-950">
                <strong className="font-semibold">Fundamental Root Cause:</strong> {exp.rootCause}
              </p>
            )}
          </div>
        )}

        {/* Future Conditions & Reflection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {exp?.futureConditions && (
            <div className="p-4 rounded-lg border border-gray-200 space-y-1">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Conditions for Future Success
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {exp.futureConditions}
              </p>
            </div>
          )}

          {exp?.whatWouldWeDoDifferently && (
            <div className="p-4 rounded-lg border border-gray-200 space-y-1">
              <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                What to Do Differently Next Time
              </h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                {exp.whatWouldWeDoDifferently}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
