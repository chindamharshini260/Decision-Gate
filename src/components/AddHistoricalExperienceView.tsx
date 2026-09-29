import React, { useState } from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  BrainCircuit, 
  AlertTriangle, 
  CheckCircle2, 
  History, 
  ArrowLeft,
  Info,
  ChevronDown,
  ChevronUp,
  FileText
} from 'lucide-react';
import { api } from '../api.ts';
import { Department } from '../types.ts';

interface AddHistoricalExperienceViewProps {
  departments: Department[];
  onNavigate: (tab: string, entityId?: string) => void;
  onRefresh: () => void;
}

export const AddHistoricalExperienceView: React.FC<AddHistoricalExperienceViewProps> = ({
  departments,
  onNavigate,
  onRefresh,
}) => {
  // Natural language mode vs structured form
  const [inputMode, setInputMode] = useState<'ai' | 'manual'>('ai');
  const [naturalLanguageText, setNaturalLanguageText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractedReviewActive, setExtractedReviewActive] = useState(false);

  // Form State
  const [projectName, setProjectName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [projectType, setProjectType] = useState('AI Application');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'Successful' | 'Partially Successful' | 'Failed' | 'Cancelled' | 'Unknown'>('Failed');
  const [problemGoal, setProblemGoal] = useState('');
  const [whatWasAttempted, setWhatWasAttempted] = useState('');
  const [approachUsed, setApproachUsed] = useState('');
  const [whatHappened, setWhatHappened] = useState('');
  const [whatWorked, setWhatWorked] = useState('');
  const [whatFailed, setWhatFailed] = useState('');
  const [whyItFailed, setWhyItFailed] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [constraints, setConstraints] = useState('');
  const [importantDecisions, setImportantDecisions] = useState('');
  const [whatWouldWeDoDifferently, setWhatWouldWeDoDifferently] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [futureConditions, setFutureConditions] = useState('');
  const [source, setSource] = useState('Postmortem Report');

  // Duplicate Warning
  const [duplicateWarning, setDuplicateWarning] = useState<{
    duplicateFound: boolean;
    reason?: string;
    existingProject?: any;
    existingExperience?: any;
  } | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<any | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Quick fill example from Main User Story
  const handleLoadUserStoryExample = () => {
    setNaturalLanguageText(
      `Historical Project: Customer Support Chatbot
Department: Customer Operations
Timeline: January 2024 to June 2024
Outcome: Cancelled / Discontinued
Problem: Automate tier-1 customer inquiries to reduce ticket resolution time.
What was attempted: An AI chatbot was deployed to answer customer questions end-to-end.
Approach: Direct LLM responses on general documentation with no human escalation path.
What happened: Customers frequently asked complicated billing questions. The chatbot hallucinated credits and gave incorrect policy details.
Why it failed: The chatbot could not reliably handle complex billing cases and there was no effective human escalation path.
Root cause: Lack of human-in-the-loop escalation criteria and absence of deterministic billing transaction guards.
Lessons learned: For billing-related AI assistants, complex cases require mandatory human escalation and clear scope boundaries.
Future conditions: Can work if strictly limited to simple FAQs with immediate live agent handoff for any billing transactions.
Source: Postmortem — Customer Support Chatbot Incident Review`
    );
  };

  // AI Extraction Trigger
  const handleExtractWithAI = async () => {
    if (!naturalLanguageText.trim()) {
      setExtractError('Please enter some text or project summary to extract.');
      return;
    }

    try {
      setIsExtracting(true);
      setExtractError(null);
      const extracted = await api.extractExperience(naturalLanguageText);

      // Populate form
      setProjectName(extracted.projectName || '');
      setProjectType(extracted.projectType || 'AI Application');
      setStatus(extracted.status || 'Failed');
      setProblemGoal(extracted.problemGoal || '');
      setWhatWasAttempted(extracted.whatWasAttempted || '');
      setApproachUsed(extracted.approachUsed || '');
      setWhatHappened(extracted.whatHappened || '');
      setWhatWorked(extracted.whatWorked || '');
      setWhatFailed(extracted.whatFailed || '');
      setWhyItFailed(extracted.whyItFailed || '');
      setRootCause(extracted.rootCause || '');
      setConstraints(extracted.constraints || '');
      setImportantDecisions(extracted.importantDecisions || '');
      setWhatWouldWeDoDifferently(extracted.whatWouldWeDoDifferently || '');
      setLessonsLearned(extracted.lessonsLearned || '');
      setFutureConditions(extracted.futureConditions || '');
      setSource(extracted.source || 'Postmortem');
      if (extracted.startDate) setStartDate(extracted.startDate);
      if (extracted.endDate) setEndDate(extracted.endDate);

      setExtractedReviewActive(true);
      setInputMode('manual'); // Switch to review form
    } catch (e: any) {
      setExtractError(e.message || 'Gemini extraction failed.');
    } finally {
      setIsExtracting(false);
    }
  };

  // Save Record
  const handleSave = async (overrideDuplicate = false) => {
    if (!projectName.trim() || !problemGoal.trim() || !whatWasAttempted.trim() || !lessonsLearned.trim()) {
      setSaveError('Please complete all required fields (Project Name, Goal, Attempt, and Lessons Learned).');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      setDuplicateWarning(null);

      // Perform pre-save duplicate check unless overridden
      if (!overrideDuplicate) {
        const dupCheck = await api.checkDuplicate(projectName, problemGoal, whatWasAttempted);
        if (dupCheck.isDuplicate) {
          setDuplicateWarning({
            duplicateFound: true,
            reason: dupCheck.reason,
            existingProject: dupCheck.existingProject,
            existingExperience: dupCheck.existingExperience,
          });
          setIsSaving(false);
          return;
        }
      }

      const projectPayload = {
        name: projectName,
        departmentId: departmentId || undefined,
        projectType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        status,
        problemGoal,
      };

      const experiencePayload = {
        problemGoal,
        whatWasAttempted,
        approachUsed,
        whatHappened,
        whatWorked,
        whatFailed,
        whyItFailed,
        rootCause,
        constraints,
        importantDecisions,
        whatWouldWeDoDifferently,
        lessonsLearned,
        futureConditions,
        source,
      };

      const result = await api.createHistoricalProject(projectPayload, experiencePayload, overrideDuplicate);
      setSaveSuccess(result);
      onRefresh();
    } catch (e: any) {
      if (e.message && e.message.includes('Similar historical experience already exists')) {
        setDuplicateWarning({
          duplicateFound: true,
          reason: e.message,
        });
      } else {
        setSaveError(e.message || 'Failed to save historical experience.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (saveSuccess) {
    const isHindsightSynced = saveSuccess.experience?.hindsightSyncStatus === 'SYNCED';

    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">Historical Experience Recorded!</h2>
              <p className="text-sm text-gray-500">Stored in relational database with stable PostgreSQL identifier.</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Project Name:</span>
              <span className="font-semibold text-gray-900">{saveSuccess.project?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Status / Outcome:</span>
              <span className="font-semibold">{saveSuccess.project?.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Database ID:</span>
              <span className="font-mono text-xs text-gray-700">{saveSuccess.experience?.id}</span>
            </div>
          </div>

          {/* Hindsight Status Banner */}
          <div className={`p-4 rounded-lg border ${
            isHindsightSynced 
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
              : 'bg-amber-50 text-amber-900 border-amber-200'
          }`}>
            <div className="flex items-center gap-2 font-semibold">
              <BrainCircuit className="w-5 h-5" />
              <span>
                {isHindsightSynced 
                  ? 'Retained in Hindsight Organizational Memory Bank' 
                  : 'Saved locally, but organizational memory synchronization failed.'}
              </span>
            </div>
            <p className="text-xs mt-1">
              {isHindsightSynced 
                ? `Memory identifier: ${saveSuccess.experience?.hindsightMemoryId || 'Retained'}. This experience is now permanently recallable during Precedent Analysis.`
                : (saveSuccess.experience?.hindsightSyncError || 'Hindsight is currently unavailable. You can retry synchronization at any time.')}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('historical-projects')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              View Historical Initiatives
            </button>
            <button
              onClick={() => {
                setSaveSuccess(null);
                setExtractedReviewActive(false);
                setNaturalLanguageText('');
                setProjectName('');
              }}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Add Another Experience
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => onNavigate('historical-projects')}
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to past initiatives
          </button>
          <h1 className="text-xl font-bold text-gray-900">Capture Historical Organizational Experience</h1>
          <p className="text-sm text-gray-500">
            Document what your organization previously tried, what worked, what failed, and the lessons learned.
          </p>
        </div>

        {/* Input Toggle */}
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

      {/* Mode 1: Natural Language AI Extraction */}
      {inputMode === 'ai' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-gray-900">Paste Postmortem, Meeting Notes, or Experience Summary</h2>
            </div>
            <button
              onClick={handleLoadUserStoryExample}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline cursor-pointer"
            >
              Insert "Customer Support Chatbot" Example
            </button>
          </div>

          <p className="text-xs text-gray-500">
            Enter raw postmortem notes or an informal project summary. Gemini will parse the goal, attempt, failure points, root cause, and lessons for your review.
          </p>

          <textarea
            rows={8}
            value={naturalLanguageText}
            onChange={(e) => setNaturalLanguageText(e.target.value)}
            placeholder="e.g. In Q1 2024, our team tried to build an AI chatbot for customer billing inquiries. It failed because customers had complex billing edge cases and there was no human escalation path..."
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
              {isExtracting ? 'Extracting with Gemini...' : 'Extract Structured Experience Preview'}
            </button>
          </div>
        </div>
      )}

      {/* AI Extraction Banner for User Review */}
      {extractedReviewActive && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-blue-900">AI extracted the following historical experience</h3>
            <p className="text-xs text-blue-700 mt-0.5">
              Review and edit all fields below before saving. Nothing is added to PostgreSQL or Hindsight memory until you explicitly confirm.
            </p>
          </div>
        </div>
      )}

      {/* Duplicate Prevention Alert */}
      {duplicateWarning && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Similar historical experience already exists</span>
          </div>
          <p className="text-xs text-amber-800">
            {duplicateWarning.reason || 'An initiative with matching title or attempt description is already registered.'}
          </p>
          {duplicateWarning.existingProject && (
            <div className="bg-white p-3 rounded border border-amber-200 text-xs space-y-1">
              <div><strong>Existing Project:</strong> {duplicateWarning.existingProject.name}</div>
              <div><strong>Existing Status:</strong> {duplicateWarning.existingProject.status}</div>
              {duplicateWarning.existingExperience?.lessonsLearned && (
                <div><strong>Recorded Lesson:</strong> {duplicateWarning.existingExperience.lessonsLearned}</div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => handleSave(true)}
              className="text-xs px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded cursor-pointer"
            >
              Save Anyway (Genuinely New Experience)
            </button>
            <button
              onClick={() => setDuplicateWarning(null)}
              className="text-xs px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-medium rounded cursor-pointer"
            >
              Cancel & Modify
            </button>
          </div>
        </div>
      )}

      {/* Structured Edit Form */}
      {(inputMode === 'manual' || extractedReviewActive) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-base font-bold text-gray-900">Project Identification & Classification</h2>
            <p className="text-xs text-gray-500">Provide basic initiative metadata.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Project / Initiative Name *
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="e.g. Customer Support Chatbot"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department (Optional)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Project Type / Domain
              </label>
              <input
                type="text"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                placeholder="e.g. AI Customer Assistant, Cloud Migration, Internal Tool"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Historical Outcome / Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              >
                <option value="Successful">Successful</option>
                <option value="Partially Successful">Partially Successful</option>
                <option value="Failed">Failed</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Start Date (Approx)
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="e.g. 2024-01-15 or Q1 2024"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                End / Discontinuation Date
              </label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="e.g. 2024-06-30"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <h2 className="text-base font-bold text-gray-900">Experience Narrative & Architecture</h2>
            <p className="text-xs text-gray-500">The experiential substance retained into Hindsight long-term memory.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Problem / Goal *
              </label>
              <textarea
                rows={2}
                value={problemGoal}
                onChange={(e) => setProblemGoal(e.target.value)}
                placeholder="What was the team trying to solve or accomplish?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                What was attempted? *
              </label>
              <textarea
                rows={2}
                value={whatWasAttempted}
                onChange={(e) => setWhatWasAttempted(e.target.value)}
                placeholder="Describe what specific initiative was deployed or attempted."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Approach Used
              </label>
              <textarea
                rows={2}
                value={approachUsed}
                onChange={(e) => setApproachUsed(e.target.value)}
                placeholder="Technical architecture, methodology, operational models."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                What Happened? (The Real Execution)
              </label>
              <textarea
                rows={2}
                value={whatHappened}
                onChange={(e) => setWhatHappened(e.target.value)}
                placeholder="What actually unfolded when put into practice?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-800 mb-1">
                  What Worked?
                </label>
                <textarea
                  rows={2}
                  value={whatWorked}
                  onChange={(e) => setWhatWorked(e.target.value)}
                  placeholder="Successful aspects to preserve"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-800 mb-1">
                  What Failed?
                </label>
                <textarea
                  rows={2}
                  value={whatFailed}
                  onChange={(e) => setWhatFailed(e.target.value)}
                  placeholder="Friction points, unexpected bugs, user resistance"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-rose-900 mb-1">
                  Why did it fail?
                </label>
                <textarea
                  rows={2}
                  value={whyItFailed}
                  onChange={(e) => setWhyItFailed(e.target.value)}
                  placeholder="Direct trigger of failure or friction"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-rose-950 mb-1">
                  Fundamental Root Cause
                </label>
                <textarea
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Underlying structural, technical, or organizational cause"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Constraints & Limitations
                </label>
                <input
                  type="text"
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  placeholder="Regulations, team capacity, tech limits"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  What would we do differently?
                </label>
                <input
                  type="text"
                  value={whatWouldWeDoDifferently}
                  onChange={(e) => setWhatWouldWeDoDifferently(e.target.value)}
                  placeholder="Actionable changes if attempting again"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-blue-900 mb-1">
                Lessons Learned (Core Precedent Insight) *
              </label>
              <textarea
                rows={2}
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="Key generalized takeaway for future initiatives"
                className="w-full px-3 py-2 text-sm border border-blue-300 bg-blue-50/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Conditions under which this approach might work in the future
              </label>
              <textarea
                rows={2}
                value={futureConditions}
                onChange={(e) => setFutureConditions(e.target.value)}
                placeholder="What requirements or safeguards must be satisfied for future success?"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Source Document / Attribution *
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="e.g. Postmortem — Customer Support Chatbot Incident Review"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {saveError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setInputMode('ai');
                setExtractedReviewActive(false);
              }}
              className="text-xs text-gray-500 hover:text-gray-900 font-medium cursor-pointer"
            >
              Re-enter text
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <BrainCircuit className="w-4 h-4" />
              {isSaving ? 'Saving & Retaining in Hindsight...' : 'Confirm & Save into Organizational Memory'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
