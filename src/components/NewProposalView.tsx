import React, { useState } from 'react';
import { 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  Building, 
  AlertCircle, 
  CheckCircle2, 
  FileSearch,
  Info
} from 'lucide-react';
import { api } from '../api.ts';
import { Department, Proposal } from '../types.ts';

interface NewProposalViewProps {
  departments: Department[];
  onNavigate: (tab: string, entityId?: string) => void;
  onRefresh: () => void;
}

export const NewProposalView: React.FC<NewProposalViewProps> = ({
  departments,
  onNavigate,
  onRefresh,
}) => {
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('ai');
  const [naturalLanguageText, setNaturalLanguageText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedReviewActive, setExtractedReviewActive] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [submittedBy, setSubmittedBy] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [problemBeingSolved, setProblemBeingSolved] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [expectedOutcome, setExpectedOutcome] = useState('');
  const [technologyApproach, setTechnologyApproach] = useState('');
  const [estimatedScope, setEstimatedScope] = useState('');
  const [knownRisks, setKnownRisks] = useState('');
  const [dependencies, setDependencies] = useState('');
  const [whyBelieveItWillWork, setWhyBelieveItWillWork] = useState('');
  const [whatIsDifferentFromPrevious, setWhatIsDifferentFromPrevious] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleExtractWithAI = async () => {
    if (!naturalLanguageText.trim()) {
      setExtractError('Please enter a proposal pitch or document text.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractError(null);
      const extracted = await api.extractProposal(naturalLanguageText);

      setTitle(extracted.title || '');
      setSubmittedBy(extracted.submittedBy || 'Project Lead');
      setProblemBeingSolved(extracted.problemBeingSolved || '');
      setProposedSolution(extracted.proposedSolution || '');
      setTargetUsers(extracted.targetUsers || '');
      setExpectedOutcome(extracted.expectedOutcome || '');
      setTechnologyApproach(extracted.technologyApproach || '');
      setEstimatedScope(extracted.estimatedScope || '');
      setKnownRisks(extracted.knownRisks || '');
      setDependencies(extracted.dependencies || '');
      setWhyBelieveItWillWork(extracted.whyBelieveItWillWork || '');
      setWhatIsDifferentFromPrevious(extracted.whatIsDifferentFromPrevious || '');
      setSuccessCriteria(extracted.successCriteria || '');

      setExtractedReviewActive(true);
      setInputMode('manual');
    } catch (e: any) {
      setExtractError(e.message || 'Gemini extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleLoadTestProposal = () => {
    setTitle('AI Demand Forecasting for Inventory Planning');
    setSubmittedBy('Operations Team');
    setProblemBeingSolved('The organization wants to reduce inventory shortages and excess stock by predicting future product demand more accurately.');
    setProposedSolution('Build an AI demand forecasting system that predicts future product demand using historical sales patterns and recommends appropriate inventory quantities.');
    setTargetUsers('Inventory Planners & Operations Managers');
    setExpectedOutcome('Improve inventory planning, reduce stockouts and excess inventory, and help teams make better purchasing decisions.');
    setTechnologyApproach('Machine learning demand forecasting model using historical sales patterns, seasonal data, and inventory recommendation algorithms.');
    setKnownRisks('Limited historical data for new products, irregular demand patterns, and model explainability.');
    setDependencies('Historical sales records, product catalog, and ERP inventory levels.');
    setWhyBelieveItWillWork('Unlike prior attempts, this approach uses differentiated strategies based on demand stability, uncertainty estimation, and human review for irregular products.');
    setWhatIsDifferentFromPrevious('Provides uncertainty scoring and enforces human-in-the-loop review for products with limited historical data.');
    setSuccessCriteria('Reduced stockouts, reduced excess inventory, and high forecast adoption by operations planners.');
    setInputMode('manual');
    setSubmitError(null);
  };

  const handleSubmit = async (andAnalyze = false) => {
    if (!title.trim() || !problemBeingSolved.trim() || !proposedSolution.trim()) {
      setSubmitError('Title, Problem Being Solved, and Proposed Solution are mandatory.');
      return;
    }

    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const payload = {
        title: title.trim(),
        submittedBy: (submittedBy || 'Project Lead').trim(),
        departmentId: departmentId || undefined,
        problemBeingSolved: problemBeingSolved.trim(),
        proposedSolution: proposedSolution.trim(),
        targetUsers: (targetUsers || 'Organization Users').trim(),
        expectedOutcome: (expectedOutcome || 'Positive business impact').trim(),
        technologyApproach: (technologyApproach || 'Standard Implementation').trim(),
        estimatedScope: estimatedScope?.trim(),
        knownRisks: knownRisks?.trim(),
        dependencies: dependencies?.trim(),
        whyBelieveItWillWork: whyBelieveItWillWork?.trim(),
        whatIsDifferentFromPrevious: whatIsDifferentFromPrevious?.trim(),
        successCriteria: successCriteria?.trim(),
        rawText: naturalLanguageText || undefined,
      };

      // 1. SAVE THE PROPOSAL FIRST to PostgreSQL / Database
      const savedProposal = await api.createProposal(payload);
      if (!savedProposal || !savedProposal.id) {
        throw new Error('Proposal could not be saved. Please try again.');
      }

      const proposalId = savedProposal.id;
      onRefresh();

      if (andAnalyze) {
        // Run Precedent Analysis Pipeline with persistent Proposal ID
        try {
          await api.runPrecedentAnalysis(proposalId);
          onRefresh();
          onNavigate('proposal-analysis', proposalId);
        } catch (analysisErr: any) {
          // If Gemini fails: Keep the proposal, show message and navigate to proposal
          console.warn('AI Precedent analysis failed after proposal was saved:', analysisErr);
          onRefresh();
          onNavigate('proposal-analysis', proposalId);
        }
      } else {
        onNavigate('proposals');
      }
    } catch (e: any) {
      setSubmitError(e.message || 'Proposal could not be saved. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Submit New Initiative or Feature Proposal</h1>
          <p className="text-sm text-gray-500">
            Submit an idea to run it through Decision Gate precedent analysis before commitments are made.
          </p>
        </div>

        {/* Input Mode Selector */}
        <div className="flex items-center bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setInputMode('ai')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              inputMode === 'ai' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Extract with AI (Fast)
          </button>
          <button
            onClick={() => setInputMode('manual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              inputMode === 'manual' ? 'bg-white text-blue-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Structured Form
          </button>
        </div>
      </div>

      {inputMode === 'ai' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">Natural Language Proposal Pitch</h2>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            Paste your proposal memo, PRD brief, or feature ticket. Gemini will extract the problem, solution, scope, and risks into structured proposal fields.
          </p>

          <textarea
            rows={8}
            value={naturalLanguageText}
            onChange={(e) => setNaturalLanguageText(e.target.value)}
            placeholder="e.g. We propose building an AI helper to answer billing questions..."
            className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />

          {extractError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {extractError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleExtractWithAI}
              disabled={isExtracting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isExtracting ? 'Extracting Proposal...' : 'Extract Structured Proposal'}
            </button>
          </div>
        </div>
      )}

      {extractedReviewActive && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-blue-900">AI Extracted Structured Proposal</h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Review and modify the extracted proposal details below before submitting.
            </p>
          </div>
        </div>
      )}

      {(inputMode === 'manual' || extractedReviewActive) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-gray-900">Proposal Scope & Sponsorship</h2>
              <p className="text-xs text-gray-500">Provide the proposal details for precedent matching.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadTestProposal}
              className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded border border-slate-300 transition-colors cursor-pointer self-start sm:self-auto"
            >
              Insert Test Proposal (Demand Forecasting)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Proposal Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI Billing Assistant"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Submitted By *
              </label>
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Users / Beneficiaries
              </label>
              <input
                type="text"
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="e.g. Enterprise customers, internal engineers"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Problem Being Solved *
              </label>
              <textarea
                rows={2}
                value={problemBeingSolved}
                onChange={(e) => setProblemBeingSolved(e.target.value)}
                placeholder="What pain point, cost, or bottleneck is being tackled?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Proposed Solution *
              </label>
              <textarea
                rows={3}
                value={proposedSolution}
                onChange={(e) => setProposedSolution(e.target.value)}
                placeholder="What is being proposed? Include operational workflow and scope bounds."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Expected Outcome
                </label>
                <textarea
                  rows={2}
                  value={expectedOutcome}
                  onChange={(e) => setExpectedOutcome(e.target.value)}
                  placeholder="Target metrics and expected outcome"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Technology / Architectural Approach
                </label>
                <textarea
                  rows={2}
                  value={technologyApproach}
                  onChange={(e) => setTechnologyApproach(e.target.value)}
                  placeholder="Tech stack, integrations, APIs"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Known Risks
                </label>
                <input
                  type="text"
                  value={knownRisks}
                  onChange={(e) => setKnownRisks(e.target.value)}
                  placeholder="Anticipated technical, policy, or operational pitfalls"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Dependencies
                </label>
                <input
                  type="text"
                  value={dependencies}
                  onChange={(e) => setDependencies(e.target.value)}
                  placeholder="Other teams, systems, or approvals required"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Why do we believe this will work?
                </label>
                <textarea
                  rows={2}
                  value={whyBelieveItWillWork}
                  onChange={(e) => setWhyBelieveItWillWork(e.target.value)}
                  placeholder="Key rationale and justification"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">
                  What is different from previous attempts? *
                </label>
                <textarea
                  rows={2}
                  value={whatIsDifferentFromPrevious}
                  onChange={(e) => setWhatIsDifferentFromPrevious(e.target.value)}
                  placeholder="Crucial distinction from earlier initiatives"
                  className="w-full px-3 py-2 text-sm border border-blue-300 bg-blue-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Success Criteria & Constraints
              </label>
              <input
                type="text"
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder="Measurable criteria for success"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {submitError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {submitError}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setInputMode('ai');
                setExtractedReviewActive(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
            >
              Re-enter raw text
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <FileSearch className="w-4 h-4" />
                {isSubmitting ? 'Submitting...' : 'Submit & Run Precedent Analysis'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
