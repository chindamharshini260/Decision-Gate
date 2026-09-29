import React from 'react';
import { 
  History, 
  CheckCircle2, 
  XCircle, 
  FileSearch, 
  BookmarkCheck, 
  HelpCircle, 
  ArrowRight, 
  PlusCircle, 
  Lightbulb, 
  BrainCircuit, 
  ShieldCheck, 
  ChevronRight,
  Database
} from 'lucide-react';
import { SystemStatus, HistoricalProject, Proposal } from '../types.ts';

interface DashboardViewProps {
  status: SystemStatus | null;
  projects: HistoricalProject[];
  proposals: Proposal[];
  onNavigate: (tab: string, entityId?: string) => void;
  onOpenDemoModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  status,
  projects,
  proposals,
  onNavigate,
  onOpenDemoModal,
}) => {
  const counts = status?.database?.counts || {
    historicalProjects: 0,
    historicalExperiences: 0,
    proposals: 0,
    analyses: 0,
    decisions: 0,
    outcomes: 0,
  };

  const successfulCount = projects.filter(p => p.status === 'Successful').length;
  const failedCount = projects.filter(p => p.status === 'Failed' || p.status === 'Cancelled').length;
  const analyzedProposalsCount = proposals.filter(p => p.status === 'ANALYZED' || p.status === 'DECIDED' || p.status === 'COMPLETED').length;
  const isMemoryEmpty = projects.length === 0;

  return (
    <div className="space-y-8 py-6">
      {/* Hero Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" /> Organizational Decision-Support System
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Don't Repeat What the Organization Already Learned.
          </h1>
          <p className="mt-2 text-base text-gray-600 leading-relaxed">
            Decision Gate connects new ideas with the organization's past experience before decisions are made.
            Hindsight provides persistent experiential memory, and Gemini reasons over historical precedents so human leaders decide with eyes wide open.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('new-proposal')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Lightbulb className="w-4 h-4" />
              Submit a Proposal
            </button>
            <button
              onClick={() => onNavigate('historical-projects')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <History className="w-4 h-4 text-gray-500" />
              Explore Historical Experience
            </button>
            <button
              onClick={() => onNavigate('add-experience')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-600" />
              Capture Past Project
            </button>
          </div>
        </div>
      </div>

      {/* Visual Workflow Diagram */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          The Closed-Loop Organizational Precedent Architecture
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 items-center text-center">
          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-gray-900">1. Past Projects</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Postmortems & Notes</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>
          
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 shadow-2xs">
            <div className="text-xs font-bold text-blue-900 flex items-center justify-center gap-1">
              <BrainCircuit className="w-3.5 h-3.5 text-blue-600" />
              <span>Hindsight Retain</span>
            </div>
            <div className="text-[10px] text-blue-700 mt-0.5">Experiential Memory</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>

          <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
            <div className="text-xs font-bold text-gray-900">2. New Proposal</div>
            <div className="text-[10px] text-gray-500 mt-0.5">Idea / Initiative</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>

          <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 shadow-2xs">
            <div className="text-xs font-bold text-indigo-900">3. Precedent Analysis</div>
            <div className="text-[10px] text-indigo-700 mt-0.5">Hindsight + Gemini</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 shadow-2xs">
            <div className="text-xs font-bold text-amber-900">4. Human Decision</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Manager Gate</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>

          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 shadow-2xs">
            <div className="text-xs font-bold text-emerald-900">5. Real Outcome</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">What Actually Occurred</div>
          </div>
          <div className="hidden lg:flex justify-center text-slate-400"><ArrowRight className="w-4 h-4" /></div>

          <div className="bg-blue-100 p-3 rounded-lg border border-blue-300 shadow-2xs">
            <div className="text-xs font-bold text-blue-950">6. Memory Grows</div>
            <div className="text-[10px] text-blue-800 mt-0.5">Retained into Hindsight</div>
          </div>
        </div>
      </div>

      {/* Real Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Historical Initiatives */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Historical Initiatives</span>
            <History className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{counts.historicalProjects}</div>
          <div className="text-[11px] text-gray-500 mt-1">Recorded in database</div>
        </div>

        {/* Successful Initiatives */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Successful</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-700">{successfulCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Proven approaches</div>
        </div>

        {/* Failed / Cancelled Initiatives */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Failed / Cancelled</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-700">{failedCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Valuable failure data</div>
        </div>

        {/* Proposals Analyzed */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Proposals Analyzed</span>
            <FileSearch className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-indigo-700">{analyzedProposalsCount}</div>
          <div className="text-[11px] text-gray-500 mt-1">Evaluated by Precedent Engine</div>
        </div>

        {/* Decisions Recorded */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Human Decisions</span>
            <BookmarkCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-700">{counts.decisions}</div>
          <div className="text-[11px] text-gray-500 mt-1">Manager gated approvals</div>
        </div>

        {/* Feedback Outcomes */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-xs font-medium">Outcomes Logged</span>
            <BrainCircuit className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-700">{counts.outcomes}</div>
          <div className="text-[11px] text-gray-500 mt-1">Loop feedback into memory</div>
        </div>
      </div>

      {/* Main Content Grid: Empty State or Active Data */}
      {isMemoryEmpty ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-8 sm:p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
            <Database className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">Your organizational memory is empty.</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
            Add your first historical project or postmortem report to begin building organizational memory.
            Decision Gate never creates fake records by default.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('add-experience')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Add First Historical Project
            </button>
            <button
              onClick={onOpenDemoModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              Load Demo Incident Data
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Past Initiatives */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Documented Past Initiatives</h3>
              </div>
              <button
                onClick={() => onNavigate('historical-projects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                View all ({projects.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 mt-2">
              {projects.slice(0, 4).map((proj) => {
                const exp = proj.experiences?.[0];
                return (
                  <div key={proj.id} className="py-3.5 hover:bg-slate-50/60 transition-colors rounded px-2 -mx-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => onNavigate('historical-detail', proj.id)}
                            className="font-semibold text-gray-900 hover:text-blue-600 text-sm cursor-pointer"
                          >
                            {proj.name}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            proj.status === 'Successful' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : proj.status === 'Partially Successful'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                          {proj.problemGoal}
                        </p>
                        {exp?.lessonsLearned && (
                          <p className="text-xs text-slate-700 font-medium mt-1.5 bg-slate-50 p-2 rounded border border-slate-100">
                            <span className="font-semibold text-slate-900">Lesson:</span> {exp.lessonsLearned}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => onNavigate('historical-detail', proj.id)}
                        className="text-xs text-gray-400 hover:text-blue-600 shrink-0 p-1 cursor-pointer"
                        title="View details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Proposals & Analysis State */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Proposals Under Consideration</h3>
              </div>
              <button
                onClick={() => onNavigate('proposals')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                View all ({proposals.length}) <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {proposals.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No active proposals yet. Submit a new proposal to evaluate it against past experiences.
              </div>
            ) : (
              <div className="divide-y divide-gray-100 mt-2">
                {proposals.slice(0, 4).map((prop) => (
                  <div key={prop.id} className="py-3.5 hover:bg-slate-50/60 transition-colors rounded px-2 -mx-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            onClick={() => onNavigate('proposal-analysis', prop.id)}
                            className="font-semibold text-gray-900 hover:text-indigo-600 text-sm cursor-pointer"
                          >
                            {prop.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                            prop.status === 'COMPLETED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : prop.status === 'DECIDED'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : prop.status === 'ANALYZED'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                          }`}>
                            {prop.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Submitted by {prop.submittedBy} • {prop.problemBeingSolved.slice(0, 80)}...
                        </p>
                        {prop.decisionRecord && (
                          <div className="text-xs font-medium mt-1.5 text-gray-700">
                            Decision: <strong className="text-blue-700">{prop.decisionRecord.decision}</strong> by {prop.decisionRecord.decisionMaker}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => onNavigate('proposal-analysis', prop.id)}
                        className="text-xs px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-medium transition-colors cursor-pointer shrink-0"
                      >
                        {prop.status === 'DRAFT' ? 'Analyze Precedent' : 'View Report'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
