import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  History, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  BrainCircuit, 
  HelpCircle, 
  RefreshCw,
  FolderKanban,
  ExternalLink
} from 'lucide-react';
import { api } from '../api.ts';

interface KnowledgeInsightsViewProps {
  onNavigate: (tab: string, entityId?: string) => void;
}

export const KnowledgeInsightsView: React.FC<KnowledgeInsightsViewProps> = ({ onNavigate }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await api.getInsights();
        setInsights(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto text-blue-600 mb-2" />
        <p className="text-sm">Aggregating organizational precedents from database...</p>
      </div>
    );
  }

  if (!insights || !insights.hasData) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center bg-white border border-dashed border-gray-300 rounded-xl p-8 space-y-3">
        <BarChart3 className="w-10 h-10 mx-auto text-gray-400" />
        <h2 className="text-base font-bold text-gray-900">No historical organizational data available.</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {insights?.message || 'Add historical experiences and run proposal evaluations to build organizational memory analytics.'}
        </p>
        <button
          onClick={() => onNavigate('add-experience')}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
        >
          Add Historical Experience
        </button>
      </div>
    );
  }

  const { stats, mostReferencedExperiences, rootCauses, departmentDistribution, decisionBreakdown } = insights;

  return (
    <div className="space-y-6 py-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Organizational Knowledge Insights</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Patterns, recurring root causes, and precedent recall frequency computed exclusively from real system records.
        </p>
      </div>

      {/* High-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-gray-500">Documented Initiatives</span>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.totalProjects}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{stats.successfulProjects} successful • {stats.failedProjects} failed</div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-gray-500">Proposals Evaluated</span>
          <div className="text-2xl font-bold text-indigo-700 mt-1">{stats.totalProposals}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{stats.precedentsRecalledCount} precedent matches</div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-gray-500">Human Decisions</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{stats.totalDecisions}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">{decisionBreakdown?.approved || 0} approved • {decisionBreakdown?.rejected || 0} rejected</div>
        </div>

        <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-2xs">
          <span className="text-xs text-gray-500">Outcomes Preserved</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{stats.totalOutcomes}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Recycled into Hindsight memory</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Frequently Referenced Historical Precedents */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-600" />
              <span>Most Frequently Referenced Past Experiences</span>
            </h2>
            <span className="text-xs text-gray-400">Precedent Recall Rank</span>
          </div>

          {mostReferencedExperiences?.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No precedent recalls logged yet. Run a proposal analysis to generate citations.</p>
          ) : (
            <div className="space-y-3">
              {mostReferencedExperiences.map((exp: any, i: number) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">{exp.projectName}</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                      Recalled {exp.recallCount}x
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2">
                    <strong className="text-gray-700">Lesson:</strong> {exp.lessonsLearned}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Common Root Causes of Historical Friction */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Documented Root Causes of Failure</span>
            </h2>
            <span className="text-xs text-gray-400">Organizational Pitfalls</span>
          </div>

          {rootCauses?.length === 0 ? (
            <p className="text-xs text-gray-500 py-4">No failure root causes documented in current records.</p>
          ) : (
            <div className="space-y-2.5">
              {rootCauses.map((rc: any, idx: number) => (
                <div key={idx} className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-0.5">
                  <span className="font-semibold text-rose-950 block">{rc.projectName}:</span>
                  <p className="text-rose-900">{rc.rootCause}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Department Knowledge Distribution */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
          <Building className="w-4 h-4 text-indigo-600" />
          <span>Departmental Precedent Distribution</span>
        </h2>

        {departmentDistribution?.length === 0 ? (
          <p className="text-xs text-gray-500">No departments configured yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {departmentDistribution.map((dept: any, idx: number) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-gray-900 block">{dept.name}</span>
                <div className="flex items-center justify-between text-gray-500 mt-2">
                  <span>Past Projects:</span>
                  <strong className="text-gray-900">{dept.projectCount}</strong>
                </div>
                <div className="flex items-center justify-between text-gray-500 mt-0.5">
                  <span>Proposals:</span>
                  <strong className="text-gray-900">{dept.proposalCount}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
