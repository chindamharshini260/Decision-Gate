import { GoogleGenAI, Type } from '@google/genai';
import { Proposal } from '../db.ts';

const SYSTEM_INSTRUCTION = `You are Decision Gate, an organizational precedent-analysis assistant.

Your role is to help people learn from documented organizational experience.

Never invent historical projects, decisions, failures, successes, employees, dates, outcomes, or lessons.

Historical facts must come from the provided database records and/or actual Hindsight recall results.

DATE & FACT INTEGRITY RULES (MANDATORY):
- NEVER invent, infer, or assume historical dates.
- NEVER use today's date, current system date, or current year (e.g. September 29, 2026) as a historical event date, project date, or failure date.
- Historical dates and timeframes must come SOLELY from the documented historical precedent (e.g. "2025-01 to 2025-06"). If no timeframe is documented in the historical record, you MUST state "Timeframe not specified in historical record".
- Never write statements like "project '...' failed on September 29, 2026" or similar today-date fabrications.
- Each provided historical precedent is a single unique real-world initiative. Do NOT create duplicate references or multiple copies of the same project.

Clearly distinguish:
1. Historical fact
2. Current proposal information
3. AI inference
4. Missing information
5. Human decision

Never claim that a historical precedent exists when Hindsight returned no relevant evidence.

Never say a proposal will definitely succeed or fail. Use evidence-based language:
- "The historical record indicates..."
- "The recalled experience involved..."
- "The current proposal includes..."
- "The following condition appears similar..."
- "The following difference may reduce the relevance of the precedent..."
- "Evidence is insufficient to determine whether the historical failure condition applies."

Never make the final business decision. The decision belongs solely to the human decision-maker.

When historical evidence is weak or contradictory, say so.
When historical evidence is strong, explain why it is relevant.
Do not blindly transfer a previous conclusion to a new proposal.
Always analyze what changed between the historical situation and the current proposal.`;

export interface ExtractedExperience {
  projectName: string;
  department?: string;
  projectType: string;
  startDate?: string;
  endDate?: string;
  status: 'Successful' | 'Partially Successful' | 'Failed' | 'Cancelled' | 'Unknown';
  problemGoal: string;
  whatWasAttempted: string;
  approachUsed: string;
  whatHappened: string;
  whatWorked?: string;
  whatFailed?: string;
  whyItFailed?: string;
  rootCause?: string;
  constraints?: string;
  importantDecisions?: string;
  whatWouldWeDoDifferently?: string;
  lessonsLearned: string;
  futureConditions?: string;
  source: string;
}

export interface ExtractedProposal {
  title: string;
  submittedBy: string;
  department?: string;
  problemBeingSolved: string;
  proposedSolution: string;
  targetUsers: string;
  expectedOutcome: string;
  technologyApproach: string;
  estimatedScope?: string;
  knownRisks?: string;
  dependencies?: string;
  whyBelieveItWillWork?: string;
  whatIsDifferentFromPrevious?: string;
  successCriteria?: string;
}

export interface PrecedentAnalysisResult {
  problemSimilarity: string;
  solutionSimilarity: string;
  targetUserSimilarity: string;
  technologySimilarity: string;
  operationalSimilarity: string;
  constraintSimilarity: string;
  expectedOutcomeSimilarity: string;
  historicalFailureConditions: string[];
  failureConditionsAssessment: {
    condition: string;
    evidence: string;
    assessment: 'Present' | 'Not Present' | 'Unclear';
    reason: string;
  }[];
  historicalSuccessConditions: string[];
  whatHasChanged: string;
  unresolvedQuestions: string[];
  aiInferenceNotes: string;
  evidenceQuality: 'HIGH' | 'MODERATE' | 'LOW' | 'INSUFFICIENT';
  precedentSummary: string;
}

class GeminiService {
  private ai: GoogleGenAI | null = null;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
  }

  private getClient(): GoogleGenAI {
    if (!this.ai) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured on the server.');
      }
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.ai;
  }

  private async generateWithFallback(params: { contents: any; config: any }) {
    const ai = this.getClient();
    const candidateModels = [
      'gemini-flash-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro-preview',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;
    for (const model of candidateModels) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${model} call failed (${err?.message?.slice(0, 120)}), trying next candidate model...`);
        continue;
      }
    }
    throw lastError;
  }

  public getStatus() {
    return {
      isAvailable: Boolean(process.env.GEMINI_API_KEY),
      model: 'gemini-3.8-flash',
    };
  }

  /**
   * Extract structured historical experience from natural language or postmortem text.
   * Shows a preview for user review before storing.
   */
  public async extractHistoricalExperience(rawText: string): Promise<ExtractedExperience> {
    const ai = this.getClient();
    const prompt = `Extract a structured organizational historical experience from this text.
DO NOT invent facts that are absent from the text. Leave unmentioned optional fields blank or state "Not specified in document".

Text to extract from:
"""
${rawText}
"""`;

    const response = await this.generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING, description: 'Project or initiative title' },
            department: { type: Type.STRING, description: 'Department or business unit' },
            projectType: { type: Type.STRING, description: 'Type of initiative, e.g. Customer Support AI, Infrastructure, Mobile App' },
            startDate: { type: Type.STRING, description: 'Start date or timeframe if mentioned' },
            endDate: { type: Type.STRING, description: 'End date or timeframe if mentioned' },
            status: {
              type: Type.STRING,
              enum: ['Successful', 'Partially Successful', 'Failed', 'Cancelled', 'Unknown'],
              description: 'Historical outcome status',
            },
            problemGoal: { type: Type.STRING, description: 'Original problem or business goal' },
            whatWasAttempted: { type: Type.STRING, description: 'What initiative was attempted' },
            approachUsed: { type: Type.STRING, description: 'Technical and operational approach used' },
            whatHappened: { type: Type.STRING, description: 'What actually unfolded during the project' },
            whatWorked: { type: Type.STRING, description: 'What parts succeeded or worked well' },
            whatFailed: { type: Type.STRING, description: 'What parts failed or caused issues' },
            whyItFailed: { type: Type.STRING, description: 'Why failure or friction occurred' },
            rootCause: { type: Type.STRING, description: 'Fundamental root cause of the outcome' },
            constraints: { type: Type.STRING, description: 'Organizational or technical constraints present' },
            importantDecisions: { type: Type.STRING, description: 'Key decisions made along the way' },
            whatWouldWeDoDifferently: { type: Type.STRING, description: 'Reflections on what to do differently' },
            lessonsLearned: { type: Type.STRING, description: 'Core takeaways and lessons learned' },
            futureConditions: { type: Type.STRING, description: 'Conditions under which this approach might work in the future' },
            source: { type: Type.STRING, description: 'Source document or context (e.g. Postmortem, Retrospective, Project Report)' },
          },
          required: ['projectName', 'projectType', 'status', 'problemGoal', 'whatWasAttempted', 'approachUsed', 'whatHappened', 'lessonsLearned', 'source'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed as ExtractedExperience;
  }

  /**
   * Extract a structured proposal from natural language text.
   */
  public async extractProposal(rawText: string): Promise<ExtractedProposal> {
    const ai = this.getClient();
    const prompt = `Extract a structured proposal from this text.
DO NOT fabricate details. If a field is not mentioned, provide a reasonable empty string or concise note.

Text:
"""
${rawText}
"""`;

    const response = await this.generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'Proposal Title' },
            submittedBy: { type: Type.STRING, description: 'Submitter name or role' },
            department: { type: Type.STRING, description: 'Department' },
            problemBeingSolved: { type: Type.STRING, description: 'Problem being solved' },
            proposedSolution: { type: Type.STRING, description: 'Proposed solution and mechanism' },
            targetUsers: { type: Type.STRING, description: 'Target user segment' },
            expectedOutcome: { type: Type.STRING, description: 'Expected outcome and business impact' },
            technologyApproach: { type: Type.STRING, description: 'Technology and architectural approach' },
            estimatedScope: { type: Type.STRING, description: 'Scope and timeline estimation' },
            knownRisks: { type: Type.STRING, description: 'Known risks and pitfalls' },
            dependencies: { type: Type.STRING, description: 'Dependencies on other teams/systems' },
            whyBelieveItWillWork: { type: Type.STRING, description: 'Justification for why it will work' },
            whatIsDifferentFromPrevious: { type: Type.STRING, description: 'What is different from previous attempts or existing solutions' },
            successCriteria: { type: Type.STRING, description: 'Measurable criteria for success' },
          },
          required: ['title', 'submittedBy', 'problemBeingSolved', 'proposedSolution', 'targetUsers', 'expectedOutcome', 'technologyApproach'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed as ExtractedProposal;
  }

  /**
   * Compare Current Proposal vs Recalled Historical Precedents.
   * Generates deep analytical Precedent Report data adhering strictly to guidelines:
   * - Does NOT make the decision
   * - Does NOT say "this will fail"
   * - Clearly distinguishes facts, proposal data, and AI inference
   * - Assesses whether historical failure conditions appear present
   * - Identifies what has changed and unresolved questions for the human manager
   */
  public async compareProposalWithPrecedents(
    proposal: Proposal,
    recalledEvidence: {
      id: string;
      projectName: string;
      status: string;
      startDate?: string;
      endDate?: string;
      problemGoal: string;
      whatWasAttempted: string;
      approachUsed: string;
      whatHappened: string;
      whatFailed?: string;
      whyItFailed?: string;
      rootCause?: string;
      lessonsLearned: string;
      futureConditions?: string;
      source: string;
    }[]
  ): Promise<PrecedentAnalysisResult> {
    const ai = this.getClient();

    const proposalContext = `
CURRENT PROPOSAL:
- Title: ${proposal.title}
- Submitted By: ${proposal.submittedBy}
- Problem Being Solved: ${proposal.problemBeingSolved}
- Proposed Solution: ${proposal.proposedSolution}
- Target Users: ${proposal.targetUsers}
- Expected Outcome: ${proposal.expectedOutcome}
- Technology / Approach: ${proposal.technologyApproach}
- Estimated Scope: ${proposal.estimatedScope || 'Not specified'}
- Known Risks: ${proposal.knownRisks || 'None stated'}
- Dependencies: ${proposal.dependencies || 'None stated'}
- Why Believe It Will Work: ${proposal.whyBelieveItWillWork || 'Not specified'}
- What Is Different: ${proposal.whatIsDifferentFromPrevious || 'Not specified'}
- Success Criteria: ${proposal.successCriteria || 'Not specified'}
`;

    const historicalContext = recalledEvidence.map((e, idx) => `
HISTORICAL PRECEDENT #${idx + 1}:
- Canonical Project Name: ${e.projectName}
- Outcome / Status: ${e.status}
- Documented Timeframe / Execution Period: ${e.startDate || e.endDate ? `${e.startDate || 'Unknown'} to ${e.endDate || 'Unknown'}` : 'Not specified in historical record'}
- Original Goal: ${e.problemGoal}
- What Was Attempted: ${e.whatWasAttempted}
- Approach Used: ${e.approachUsed}
- What Happened: ${e.whatHappened}
- What Failed: ${e.whatFailed || 'N/A'}
- Why It Failed: ${e.whyItFailed || 'N/A'}
- Root Cause: ${e.rootCause || 'N/A'}
- Lessons Learned: ${e.lessonsLearned}
- Conditions for Future Success: ${e.futureConditions || 'N/A'}
- Documented Source: ${e.source}
`).join('\n----------------------------------------\n');

    const prompt = `Perform a comprehensive organizational precedent comparison between the current proposal and the documented historical experiences.

${proposalContext}

========================================
HISTORICAL EXPERIENCES RECALLED (CANONICAL UNIQUE RECORDS):
${historicalContext}
========================================

Analyze:
1. Similarities across: problem, solution, target users, technology, operations, constraints, expected outcome.
2. Meaningful differences between the historical attempts and the current proposal.
3. Historical Failure Conditions: Identify specific conditions that led to previous failures or issues.
4. Failure Condition Check: For each historical failure condition, check if evidence exists in the new proposal, assessing whether it is Present, Not Present, or Unclear.
5. Historical Success Conditions: Identify any elements that previously succeeded or were recommended.
6. What Has Changed: What environmental, technological, or design factors have changed since previous attempts.
7. Unresolved Questions: Crucial questions the human manager must verify before making an approval decision.
8. Evidence Quality and AI Inference Notes.

CRITICAL INSTRUCTIONS:
- Do NOT output "Approve" or "Reject". Use objective, evidence-based language.
- DATE INTEGRITY: NEVER state or infer that a past project failed on today's date or current date (e.g. September 29, 2026). If the historical precedent has a timeframe (e.g. 2025-01 to 2025-06), cite ONLY that timeframe. If no timeframe is in the historical record, say "Timeframe not specified".
- ENTITY INTEGRITY: Treat each recalled precedent as ONE real-world historical initiative. Do NOT duplicate or split it.`;

    const response = await this.generateWithFallback({
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            precedentSummary: { type: Type.STRING, description: 'Executive summary of the precedent comparison findings' },
            problemSimilarity: { type: Type.STRING, description: 'Detailed comparison of the problems addressed' },
            solutionSimilarity: { type: Type.STRING, description: 'Detailed comparison of proposed solutions vs past attempts' },
            targetUserSimilarity: { type: Type.STRING, description: 'Comparison of target audience and user segments' },
            technologySimilarity: { type: Type.STRING, description: 'Comparison of tech stack, architectural choices, and tools' },
            operationalSimilarity: { type: Type.STRING, description: 'Comparison of workflow, human-in-the-loop, and operational overhead' },
            constraintSimilarity: { type: Type.STRING, description: 'Comparison of organizational constraints and policy factors' },
            expectedOutcomeSimilarity: { type: Type.STRING, description: 'Comparison of intended outcomes and value metrics' },
            historicalFailureConditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of specific conditions that contributed to historical failures or cancellations',
            },
            failureConditionsAssessment: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  condition: { type: Type.STRING, description: 'Historical failure condition' },
                  evidence: { type: Type.STRING, description: 'Specific text or evidence found in the current proposal' },
                  assessment: {
                    type: Type.STRING,
                    enum: ['Present', 'Not Present', 'Unclear'],
                    description: 'Whether the failure condition appears to exist in current proposal',
                  },
                  reason: { type: Type.STRING, description: 'Evidence-backed reasoning for this assessment' },
                },
                required: ['condition', 'evidence', 'assessment', 'reason'],
              },
              description: 'Step-by-step check of each historical failure condition against the new proposal',
            },
            historicalSuccessConditions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Conditions that previously contributed to successful approaches',
            },
            whatHasChanged: { type: Type.STRING, description: 'What has changed between historical attempt and current proposal' },
            unresolvedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific questions the human decision-maker should verify before approving',
            },
            aiInferenceNotes: { type: Type.STRING, description: 'Explicit boundary clearly separating AI reasoning from recorded historical facts' },
            evidenceQuality: {
              type: Type.STRING,
              enum: ['HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT'],
              description: 'Assessment of the depth and direct applicability of historical records',
            },
          },
          required: [
            'precedentSummary',
            'problemSimilarity',
            'solutionSimilarity',
            'targetUserSimilarity',
            'technologySimilarity',
            'operationalSimilarity',
            'constraintSimilarity',
            'expectedOutcomeSimilarity',
            'historicalFailureConditions',
            'failureConditionsAssessment',
            'historicalSuccessConditions',
            'whatHasChanged',
            'unresolvedQuestions',
            'aiInferenceNotes',
            'evidenceQuality',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return parsed as PrecedentAnalysisResult;
  }
}

export const geminiService = new GeminiService();
