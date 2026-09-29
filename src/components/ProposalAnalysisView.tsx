import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileSearch, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  History, 
  Sparkles, 
  RefreshCw, 
  ShieldAlert, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookmarkCheck
} from 'lucide-react';
import { api } from '../api.ts';
import { Proposal, PrecedentReportData } from '../types.ts';

interface ProposalAnalysisViewProps {
  proposalId: string;
  onNavigate: (tab: string, entityId?: string) => void;
  onOpenDecisionModal: (proposal: Proposal) => void;
  onOpenOutcomeModal: (proposal: Proposal) => void;
  onRefresh: () => void;
}

export const ProposalAnalysisView: React.FC<ProposalAnalysisViewProps> = ({
  proposalId,
  onNavigate,
  onOpenDecisionModal,
  onOpenOutcomeModal,
  onRefresh,
}) => {
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [report, setReport] = useState<PrecedentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeAnalysisStep, setActiveAnalysisStep] = useState<number>(0);

  // Load Proposal and existing Report if already analyzed
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prop = await api.getProposalById(proposalId);
        setProposal(prop);

        // Try fetching latest precedent report
        try {
          const rep = await api.getPrecedentReport(proposalId);
          setReport(rep);
        } catch (_) {
          // No report yet, waiting to run analysis
          setReport(null);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load proposal.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [proposalId]);

  // Run Precedent Analysis Pipeline
  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);
      setActiveAnalysisStep(1);

      // Simulation steps for live UX visualization
      setTimeout(() => setActiveAnalysisStep(2), 700);
      setTimeout(() => setActiveAnalysisStep(3), 1400);
      setTimeout(() => setActiveAnalysisStep(4), 2100);

      await api.runPrecedentAnalysis(proposalId);

      const updatedProp = await api.getProposalById(proposalId);
      setProposal(updatedProp);

      const rep = await api.getPrecedentReport(proposalId);
      setReport(rep);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Precedent analysis failed.');
    } finally {
      setAnalyzing(false);
      setActiveAnalysisStep(0);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="text-base font-semibold text-gray-800">Loading proposal & precedent registry...</p>
      </div>
    );
  }

  if (error && !proposal) {
    return (
      <div className="py-12 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 mx-auto text-amber-500" />
        <h3 className="text-base font-bold text-gray-900">Proposal Error</h3>
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => onNavigate('proposals')}
          className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded font-medium cursor-pointer"
        >
          Return to Proposals
        </button>
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate('proposals')}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Proposals
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{proposal.title}</h1>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
              proposal.status === 'COMPLETED'
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : proposal.status === 'DECIDED'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : proposal.status === 'ANALYZED'
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              {proposal.status}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Submitted by <strong>{proposal.submittedBy}</strong> • {proposal.department?.name || 'General Department'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {report ? (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg shadow-2xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${analyzing ? 'animate-spin' : ''}`} />
              Re-run Analysis
            </button>
          ) : (
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <FileSearch className="w-4 h-4" />
              {analyzing ? 'Running Precedent Engine...' : 'Run Precedent Analysis'}
            </button>
          )}

          {/* Decision Button */}
          <button
            onClick={() => onOpenDecisionModal(proposal)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            {proposal.decisionRecord ? 'Update Decision' : 'Make Decision'}
          </button>
        </div>
      </div>

      {/* Analysis In-Progress Live Feedback */}
      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 font-bold text-sm text-blue-900">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Executing 6-Step Decision Gate Precedent Pipeline</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className={`flex items-center gap-2 ${activeAnalysisStep >= 1 ? 'text-blue-900 font-semibold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Step 1: Validating proposal scope & terminology
            </div>
            <div className={`flex items-center gap-2 ${activeAnalysisStep >= 2 ? 'text-blue-900 font-semibold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Step 2: Querying Hindsight organizational memory (TEMPR search)
            </div>
            <div className={`flex items-center gap-2 ${activeAnalysisStep >= 3 ? 'text-blue-900 font-semibold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Step 3: Extracting historical failure and success conditions
            </div>
            <div className={`flex items-center gap-2 ${activeAnalysisStep >= 4 ? 'text-blue-900 font-semibold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Step 4: Gemini comparative reasoning across problem, approach & mitigations
            </div>
            <div className={`flex items-center gap-2 ${activeAnalysisStep >= 4 ? 'text-blue-900 font-semibold' : 'text-gray-400'}`}>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Step 5: Synthesizing Precedent Report with verification questions
            </div>
          </div>
        </div>
      )}

      {/* Decision Banner if already decided */}
      {proposal.decisionRecord && (
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          proposal.decisionRecord.decision === 'Approved'
            ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
            : proposal.decisionRecord.decision === 'Rejected'
            ? 'bg-rose-50 text-rose-950 border-rose-300'
            : 'bg-amber-50 text-amber-950 border-amber-300'
        }`}>
          <div>
            <div className="flex items-center gap-2 font-bold text-sm">
              <BookmarkCheck className="w-4 h-4" />
              <span>Human Decision Recorded: {proposal.decisionRecord.decision}</span>
              <span className="text-xs font-normal text-gray-600">by {proposal.decisionRecord.decisionMaker} on {proposal.decisionRecord.decidedAt.slice(0, 10)}</span>
            </div>
            <p className="text-xs mt-1 text-gray-700">
              <strong>Reason:</strong> {proposal.decisionRecord.reason}
            </p>
            {proposal.decisionRecord.conditions && (
              <p className="text-xs text-gray-700 mt-0.5">
                <strong>Conditions:</strong> {proposal.decisionRecord.conditions}
              </p>
            )}
          </div>

          {!proposal.outcome ? (
            <button
              onClick={() => onOpenOutcomeModal(proposal)}
              className="px-3 py-1.5 bg-white border border-gray-300 text-gray-800 rounded font-semibold text-xs shadow-2xs hover:bg-gray-50 cursor-pointer shrink-0"
            >
              Log Actual Outcome
            </button>
          ) : (
            <div className="text-xs bg-white px-3 py-1 rounded border font-semibold text-blue-900">
              Outcome: {proposal.outcome.actualResult}
            </div>
          )}
        </div>
      )}

      {/* Proposal Summary Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Current Proposal Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 block">Problem Being Solved</span>
            <p className="text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{proposal.problemBeingSolved}</p>
          </div>
          <div className="space-y-1">
            <span className="font-semibold text-gray-900 block">Proposed Solution</span>
            <p className="text-gray-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{proposal.proposedSolution}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs text-gray-600">
          <div><strong className="text-gray-900">Technology:</strong> {proposal.technologyApproach}</div>
          <div><strong className="text-gray-900">Target Users:</strong> {proposal.targetUsers}</div>
          <div><strong className="text-gray-900">Expected Outcome:</strong> {proposal.expectedOutcome}</div>
        </div>
      </div>

      {/* If No Report Generated Yet */}
      {!report && !analyzing && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center space-y-3">
          <FileSearch className="w-10 h-10 mx-auto text-blue-600" />
          <h3 className="text-base font-bold text-gray-900">Precedent Analysis Not Yet Run</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Click below to query Hindsight organizational memory, match similar historical initiatives, and assess whether past failure conditions appear in this proposal.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
          >
            <FileSearch className="w-4 h-4" />
            Run Precedent Analysis
          </button>
        </div>
      )}

      {/* Case A: Report Ready - ZERO PRECEDENTS FOUND */}
      {report && !report.analysis.precedentFound && (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 text-slate-700 pb-4 border-b border-gray-100">
            <HelpCircle className="w-7 h-7 text-slate-400" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">NO RELEVANT ORGANIZATIONAL PRECEDENT FOUND</h2>
              <p className="text-xs text-gray-500">
                Hindsight organizational memory and database records contain zero matching previous attempts for this domain.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900">Questions the Decision Maker Should Verify Before Proceeding:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              {report.analysis.unresolvedQuestions.map((q, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action to proceed with decision */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Because this is a novel initiative with no documented failures, human evaluation is required.
            </span>
            <button
              onClick={() => onOpenDecisionModal(proposal)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg cursor-pointer shadow-xs"
            >
              Record Decision as Novel Initiative
            </button>
          </div>
        </div>
      )}

      {/* Case B: Full Precedent Report */}
      {report && report.analysis.precedentFound && report.comparison && (
        <div className="space-y-6">
          {/* Section 1: Precedent Summary */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Precedent Report
                </span>
                <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                  Historical Precedent Found: YES
                </h2>
              </div>

              {/* Memory stats */}
              <div className="flex items-center gap-3 text-xs">
                <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                  <strong>{report.precedents.length}</strong> Relevant Past Experiences
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                  Evidence Quality: <strong className="text-gray-900">{report.comparison.evidenceQuality}</strong>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed font-medium bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              {report.comparison.precedentSummary || 'Comparative analysis between proposal and historical precedent.'}
            </p>

            {/* Recalled Precedents List */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                Recalled Organizational Experiences:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.precedents.map((prec, i) => (
                  <div key={i} className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{prec.projectName}</span>
                      <span className={`px-2 py-0.5 rounded font-semibold text-[10px] border ${
                        prec.status === 'Successful' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {prec.status}
                      </span>
                    </div>
                    <p className="text-gray-600 line-clamp-2">
                      <strong className="text-gray-800">Lesson:</strong> {prec.lessonsLearned}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                      <span>Source: {prec.source}</span>
                      <span className="text-blue-600 font-medium">{prec.whyRecalled.slice(0, 35)}...</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Similarities & Differences */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-gray-900">Evidence-Backed Similarities</h3>
              </div>
              <div className="space-y-3 text-xs text-gray-700">
                <div>
                  <strong className="text-gray-900 block mb-0.5">Problem Similarity:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.problemSimilarity}</p>
                </div>
                <div>
                  <strong className="text-gray-900 block mb-0.5">Solution & Approach Similarity:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.solutionSimilarity}</p>
                </div>
                <div>
                  <strong className="text-gray-900 block mb-0.5">Target Users:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.targetUserSimilarity}</p>
                </div>
                <div>
                  <strong className="text-gray-900 block mb-0.5">Technology & Architecture:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.technologySimilarity}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Meaningful Differences & Changes</h3>
              </div>
              <div className="space-y-3 text-xs text-gray-700">
                <div>
                  <strong className="text-gray-900 block mb-0.5">What Has Changed Since Previous Attempt:</strong>
                  <p className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 text-indigo-950 leading-relaxed font-medium">
                    {report.comparison.whatHasChanged}
                  </p>
                </div>
                <div>
                  <strong className="text-gray-900 block mb-0.5">Operational & Workflow Differences:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.operationalSimilarity}</p>
                </div>
                <div>
                  <strong className="text-gray-900 block mb-0.5">Constraints Comparison:</strong>
                  <p className="bg-slate-50 p-2.5 rounded border border-slate-100">{report.comparison.constraintSimilarity}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Historical Failure Conditions vs Current Proposal Check */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Historical Failure Condition Check
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Does the current proposal re-introduce conditions that previously caused failure or cancellation?
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                Critical Decision Gate
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {report.comparison.failureConditionsAssessment.map((item, idx) => {
                const isPresent = item.assessment === 'Present';
                const isNotPresent = item.assessment === 'Not Present';
                const isUnclear = item.assessment === 'Unclear';

                return (
                  <div key={idx} className="py-4 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-sm text-gray-900">{item.condition}</span>
                      </div>

                      {/* Assessment Tag */}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded border inline-flex items-center gap-1 shrink-0 ${
                        isPresent
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : isNotPresent
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {isPresent && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {isNotPresent && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {isUnclear && <HelpCircle className="w-3.5 h-3.5 text-amber-600" />}
                        Failure Condition: {item.assessment}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1 pl-7">
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <strong className="text-gray-700 block mb-0.5">Current Proposal Evidence:</strong>
                        <span className="text-gray-600">{item.evidence}</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                        <strong className="text-gray-700 block mb-0.5">Analysis / Reasoning:</strong>
                        <span className="text-gray-600">{item.reason}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Success Conditions & Unresolved Verification Questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Historical Success Conditions */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Historical Success Factors to Enforce</span>
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                {report.comparison.historicalSuccessConditions.map((cond, i) => (
                  <li key={i} className="flex items-start gap-2 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Questions to Verify Before Approval */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-blue-600" />
                <span>Questions to Verify Before Approval</span>
              </h3>
              <ul className="space-y-2 text-xs text-gray-700">
                {report.comparison.unresolvedQuestions.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                    <span className="w-4 h-4 rounded-full bg-blue-200 text-blue-900 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="font-medium text-gray-800">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 5: AI Inference & System Boundary Disclaimer */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800">
              <ShieldAlert className="w-4 h-4 text-blue-600" />
              <span>Boundary: Historical Facts vs. AI Inference</span>
            </div>
            <p className="leading-relaxed">
              {report.comparison.aiInferenceNotes}
            </p>
            <p className="text-[11px] text-slate-500 italic">
              Decision Gate provides precedent intelligence and historical verification points only. It never autonomously approves, rejects, or replaces executive judgment.
            </p>
          </div>

          {/* Section 6: Human Decision Gate Bar */}
          <div className="bg-white border-2 border-blue-500 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Step 8: Human Decision Gate
                </span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">
                  Human Decision Required
                </h3>
                <p className="text-xs text-gray-500">
                  Select an action based on the precedent findings and risk verification points.
                </p>
              </div>

              {proposal.decisionRecord ? (
                <div className="text-xs text-right">
                  <span className="font-semibold text-gray-700">Current Status:</span>{' '}
                  <strong className="text-blue-700">{proposal.decisionRecord.decision}</strong>
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <button
                onClick={() => onOpenDecisionModal(proposal)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                Approve Proposal
              </button>
              <button
                onClick={() => onOpenDecisionModal(proposal)}
                className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                Reject Proposal
              </button>
              <button
                onClick={() => onOpenDecisionModal(proposal)}
                className="py-3 px-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                Request More Info
              </button>
              <button
                onClick={() => onOpenDecisionModal(proposal)}
                className="py-3 px-4 bg-slate-600 hover:bg-slate-700 text-white font-bold text-sm rounded-lg shadow-xs transition-colors cursor-pointer text-center"
              >
                Defer Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
