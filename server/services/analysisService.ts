import { db, Proposal } from '../db.ts';
import { hindsightService } from './hindsightService.ts';
import { geminiService, PrecedentAnalysisResult } from './geminiService.ts';

export interface RunAnalysisResponse {
  success: boolean;
  precedentFound: boolean;
  memoryStatus: 'CONNECTED' | 'UNAVAILABLE';
  statusMessage: string;
  memoriesRecalledCount: number;
  unresolvedQuestions: string[];
  comparison: PrecedentAnalysisResult | null;
  recalledPrecedents: {
    id: string;
    historicalExperienceId?: string;
    hindsightMemoryId?: string;
    relevanceScore?: number;
    projectName: string;
    status: string;
    whyRecalled: string;
    summary: string;
    source: string;
    lessonsLearned: string;
  }[];
  error?: string;
}

export class AnalysisService {
  /**
   * Complete Precedent Analysis Pipeline:
   * STEP 1: Validate proposal
   * STEP 2: Construct structured Hindsight recall query
   * STEP 3: Recall relevant experiences from Hindsight
   * STEP 4: If no memories found, return clear zero-precedent state without fabricating
   * STEP 5: If memories found, pass to Gemini for structured comparison
   * STEP 6: Store results and return full Precedent Report
   */
  public async runPrecedentAnalysis(proposalId: string): Promise<RunAnalysisResponse> {
    const proposal = await db.getProposalById(proposalId);
    if (!proposal) {
      throw new Error(`Proposal with ID ${proposalId} not found.`);
    }

    // Step 2: Construct rich Hindsight query
    const recallQuery = [
      proposal.title,
      proposal.problemBeingSolved,
      proposal.proposedSolution,
      `Target users: ${proposal.targetUsers}`,
      `Technology and approach: ${proposal.technologyApproach}`,
      `Expected outcome: ${proposal.expectedOutcome}`,
      proposal.knownRisks ? `Risks: ${proposal.knownRisks}` : '',
      proposal.dependencies ? `Dependencies: ${proposal.dependencies}` : '',
    ].filter(Boolean).join('. ');

    const hindsightStatus = hindsightService.getStatus();
    let memoryStatus: 'CONNECTED' | 'UNAVAILABLE' = hindsightStatus.isAvailable ? 'CONNECTED' : 'UNAVAILABLE';
    let rawRecalledFacts: any[] = [];
    let recallErrorMessage: string | undefined = undefined;

    if (hindsightStatus.isAvailable) {
      try {
        const recallRes = await hindsightService.recallRelevantPrecedents(recallQuery, 10);
        if (recallRes.success) {
          rawRecalledFacts = recallRes.results;
        } else {
          recallErrorMessage = recallRes.error || recallRes.statusMessage;
        }
      } catch (err: any) {
        recallErrorMessage = err?.message || 'Hindsight recall error';
      }
    }

    // Also look up any experiences saved in PostgreSQL/local database to match by documentId or semantic relevance
    const allStoredExperiences = await db.getAllExperiences();

    interface CanonicalEvidence {
      experienceId?: string;
      projectName: string;
      status: string;
      startDate?: string;
      endDate?: string;
      problemGoal: string;
      whatWasAttempted: string;
      approachUsed: string;
      whatHappened: string;
      whatWorked?: string;
      whatFailed?: string;
      whyItFailed?: string;
      rootCause?: string;
      lessonsLearned: string;
      futureConditions?: string;
      source: string;
      hindsightMemoryId?: string;
      whyRecalled: string;
      relevanceScore: number;
    }

    const canonicalEvidenceMap = new Map<string, CanonicalEvidence>();
    const cleanNorm = (str: string) => (str || '').toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
    const cleanProj = (str: string) => cleanNorm(str).replace(/\b(system|project|initiative|tool|app|application|platform|assistant|service)\b/g, '').replace(/\s+/g, ' ').trim();

    // 1. Process Hindsight recalled memories and map to unique canonical entities
    for (const fact of rawRecalledFacts) {
      // Find matching stored experience in database
      const matchedExp = allStoredExperiences.find(e => 
        e.id === fact.documentId || 
        (e.hindsightMemoryId && e.hindsightMemoryId === fact.id) ||
        (fact.metadata?.experienceId && e.id === fact.metadata.experienceId) ||
        (fact.metadata?.projectName && cleanNorm(e.project?.name) === cleanNorm(fact.metadata.projectName)) ||
        (cleanProj(e.project?.name).length >= 4 && cleanNorm(fact.text).includes(cleanProj(e.project?.name)))
      );

      if (matchedExp) {
        const canonicalKey = `exp_${matchedExp.id}`;
        if (canonicalEvidenceMap.has(canonicalKey)) {
          const existing = canonicalEvidenceMap.get(canonicalKey)!;
          existing.relevanceScore = Math.max(existing.relevanceScore, fact.score || 0.88);
          if (!existing.hindsightMemoryId && fact.id) existing.hindsightMemoryId = fact.id;
          continue;
        }

        canonicalEvidenceMap.set(canonicalKey, {
          experienceId: matchedExp.id,
          projectName: matchedExp.project?.name || 'Historical Project',
          status: matchedExp.project?.status || 'Unknown',
          startDate: matchedExp.project?.startDate,
          endDate: matchedExp.project?.endDate,
          problemGoal: matchedExp.problemGoal,
          whatWasAttempted: matchedExp.whatWasAttempted,
          approachUsed: matchedExp.approachUsed,
          whatHappened: matchedExp.whatHappened,
          whatWorked: matchedExp.whatWorked,
          whatFailed: matchedExp.whatFailed,
          whyItFailed: matchedExp.whyItFailed,
          rootCause: matchedExp.rootCause,
          lessonsLearned: matchedExp.lessonsLearned,
          futureConditions: matchedExp.futureConditions,
          source: matchedExp.source,
          hindsightMemoryId: fact.id || matchedExp.hindsightMemoryId,
          whyRecalled: `Retrieved by Hindsight organizational memory matching query terms in "${proposal.title}".`,
          relevanceScore: fact.score || 0.88,
        });
      } else {
        const pName = fact.metadata?.projectName || 'Hindsight Memory Precedent';
        const canonicalKey = `mem_${cleanProj(pName) || fact.id}`;

        if (canonicalEvidenceMap.has(canonicalKey)) {
          const existing = canonicalEvidenceMap.get(canonicalKey)!;
          existing.relevanceScore = Math.max(existing.relevanceScore, fact.score || 0.82);
          continue;
        }

        canonicalEvidenceMap.set(canonicalKey, {
          projectName: pName,
          status: fact.metadata?.status || 'Previous Attempt',
          startDate: fact.metadata?.startDate,
          endDate: fact.metadata?.endDate,
          problemGoal: fact.context || 'Historical experience recorded in memory bank',
          whatWasAttempted: fact.text,
          approachUsed: 'Refer to recorded memory context',
          whatHappened: fact.text,
          lessonsLearned: fact.metadata?.lessonsLearned || 'Extracted from organizational memory bank',
          source: fact.metadata?.source || 'Hindsight Memory Bank',
          hindsightMemoryId: fact.id,
          whyRecalled: 'Retrieved by Hindsight semantic & graph memory search.',
          relevanceScore: fact.score || 0.82,
        });
      }
    }

    // 2. If Hindsight is not configured or returned no memories, check stored database experiences
    if (canonicalEvidenceMap.size === 0 && allStoredExperiences.length > 0) {
      const queryLower = recallQuery.toLowerCase();
      const keywords = queryLower.split(/\W+/).filter(w => w.length > 3);

      for (const exp of allStoredExperiences) {
        const textToMatch = `${exp.project?.name} ${exp.problemGoal} ${exp.whatWasAttempted} ${exp.approachUsed} ${exp.whatHappened} ${exp.lessonsLearned}`.toLowerCase();
        const matchCount = keywords.filter(k => textToMatch.includes(k)).length;

        if (matchCount >= 2 || (keywords.length <= 3 && matchCount >= 1)) {
          const canonicalKey = `exp_${exp.id}`;
          if (!canonicalEvidenceMap.has(canonicalKey)) {
            canonicalEvidenceMap.set(canonicalKey, {
              experienceId: exp.id,
              projectName: exp.project?.name || 'Historical Project',
              status: exp.project?.status || 'Unknown',
              startDate: exp.project?.startDate,
              endDate: exp.project?.endDate,
              problemGoal: exp.problemGoal,
              whatWasAttempted: exp.whatWasAttempted,
              approachUsed: exp.approachUsed,
              whatHappened: exp.whatHappened,
              whatWorked: exp.whatWorked,
              whatFailed: exp.whatFailed,
              whyItFailed: exp.whyItFailed,
              rootCause: exp.rootCause,
              lessonsLearned: exp.lessonsLearned,
              futureConditions: exp.futureConditions,
              source: exp.source,
              hindsightMemoryId: exp.hindsightMemoryId,
              whyRecalled: `Domain keyword match on historical initiative with ${matchCount} intersecting concepts.`,
              relevanceScore: 0.75 + Math.min(0.2, matchCount * 0.05),
            });
          }
        }
      }
    }

    const matchedEvidence = Array.from(canonicalEvidenceMap.values());

    // Step 4: If no precedents exist, DO NOT invent!
    if (matchedEvidence.length === 0) {
      const questionsForNewInitiative = [
        'Has any other team or business unit attempted an unrecorded pilot in this domain?',
        'What are the core technical assumptions that have not yet been validated?',
        'What is the minimum viable experiment to test this before committing full budget?',
        'Who is the executive sponsor accountable for the measurable outcome?',
      ];

      await db.saveAnalysisResult(
        proposalId,
        recallQuery,
        memoryStatus,
        0,
        false,
        questionsForNewInitiative,
        [],
        null
      );

      return {
        success: true,
        precedentFound: false,
        memoryStatus,
        statusMessage: 'NO RELEVANT ORGANIZATIONAL PRECEDENT FOUND.',
        memoriesRecalledCount: 0,
        unresolvedQuestions: questionsForNewInitiative,
        comparison: null,
        recalledPrecedents: [],
        error: recallErrorMessage,
      };
    }

    // Step 5: Pass recalled evidence to Gemini for deep structured comparison
    const comparisonResult = await geminiService.compareProposalWithPrecedents(
      proposal,
      matchedEvidence.map(e => ({
        id: e.experienceId || e.hindsightMemoryId || 'temp',
        projectName: e.projectName,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        problemGoal: e.problemGoal,
        whatWasAttempted: e.whatWasAttempted,
        approachUsed: e.approachUsed,
        whatHappened: e.whatHappened,
        whatFailed: e.whatFailed,
        whyItFailed: e.whyItFailed,
        rootCause: e.rootCause,
        lessonsLearned: e.lessonsLearned || '',
        futureConditions: e.futureConditions,
        source: e.source,
      }))
    );

    // Format recalled precedents for database
    const dbPrecedents = matchedEvidence.map(e => ({
      historicalExperienceId: e.experienceId,
      hindsightMemoryId: e.hindsightMemoryId,
      relevanceScore: e.relevanceScore,
      whyRecalled: e.whyRecalled,
      summary: e.lessonsLearned && e.lessonsLearned.trim().length > 0
        ? `${e.projectName} (${e.status}): ${e.lessonsLearned}`
        : `${e.projectName} (${e.status}): ${e.whatHappened || e.whatWasAttempted}`,
      content: JSON.stringify(e),
    }));

    // Step 6: Save analysis to database
    await db.saveAnalysisResult(
      proposalId,
      recallQuery,
      memoryStatus,
      matchedEvidence.length,
      true,
      comparisonResult.unresolvedQuestions,
      dbPrecedents,
      {
        problemSimilarity: comparisonResult.problemSimilarity,
        solutionSimilarity: comparisonResult.solutionSimilarity,
        targetUserSimilarity: comparisonResult.targetUserSimilarity,
        technologySimilarity: comparisonResult.technologySimilarity,
        operationalSimilarity: comparisonResult.operationalSimilarity,
        constraintSimilarity: comparisonResult.constraintSimilarity,
        expectedOutcomeSimilarity: comparisonResult.expectedOutcomeSimilarity,
        historicalFailureConditions: comparisonResult.historicalFailureConditions,
        failureConditionsAssessment: comparisonResult.failureConditionsAssessment,
        historicalSuccessConditions: comparisonResult.historicalSuccessConditions,
        whatHasChanged: comparisonResult.whatHasChanged,
        unresolvedQuestions: comparisonResult.unresolvedQuestions,
        aiInferenceNotes: comparisonResult.aiInferenceNotes,
        evidenceQuality: comparisonResult.evidenceQuality,
      }
    );

    return {
      success: true,
      precedentFound: true,
      memoryStatus,
      statusMessage: `Found ${matchedEvidence.length} relevant historical ${matchedEvidence.length === 1 ? 'experience' : 'experiences'}. Precedent report ready.`,
      memoriesRecalledCount: matchedEvidence.length,
      unresolvedQuestions: comparisonResult.unresolvedQuestions,
      comparison: comparisonResult,
      recalledPrecedents: matchedEvidence.map(e => ({
        id: e.experienceId || e.hindsightMemoryId || 'id',
        historicalExperienceId: e.experienceId,
        hindsightMemoryId: e.hindsightMemoryId,
        relevanceScore: e.relevanceScore,
        projectName: e.projectName,
        status: e.status,
        startDate: e.startDate,
        endDate: e.endDate,
        whyRecalled: e.whyRecalled,
        summary: e.lessonsLearned && e.lessonsLearned.trim().length > 0
          ? `${e.projectName} (${e.status}): ${e.lessonsLearned}`
          : `${e.projectName} (${e.status}): ${e.whatHappened || e.whatWasAttempted}`,
        source: e.source,
        lessonsLearned: e.lessonsLearned || '',
      })),
      error: recallErrorMessage,
    };
  }
}

export const analysisService = new AnalysisService();
