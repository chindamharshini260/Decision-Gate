export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface HistoricalProject {
  id: string;
  name: string;
  departmentId?: string;
  projectType: string;
  startDate?: string;
  endDate?: string;
  status: 'Successful' | 'Partially Successful' | 'Failed' | 'Cancelled' | 'Unknown';
  problemGoal: string;
  sourceDocId?: string;
  createdAt: string;
  updatedAt: string;
  experiences?: HistoricalExperience[];
  department?: Department;
}

export interface HistoricalExperience {
  id: string;
  projectId: string;
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
  sourceDocumentId?: string;
  hindsightMemoryId?: string;
  hindsightSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  hindsightSyncedAt?: string;
  hindsightSyncError?: string;
  createdAt: string;
  updatedAt: string;
  project?: HistoricalProject;
}

export interface Proposal {
  id: string;
  title: string;
  submittedBy: string;
  userId?: string;
  departmentId?: string;
  department?: Department;
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
  rawText?: string;
  status: 'DRAFT' | 'ANALYZED' | 'DECIDED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  decisionRecord?: DecisionRecord;
  outcome?: ProposalOutcome;
  latestAnalysis?: ProposalAnalysis;
}

export interface ProposalAnalysis {
  id: string;
  proposalId: string;
  queryUsed: string;
  memoryStatus: 'CONNECTED' | 'UNAVAILABLE';
  memoriesRecalledCount: number;
  precedentFound: boolean;
  unresolvedQuestions: string[];
  createdAt: string;
}

export interface RecalledPrecedent {
  id: string;
  analysisId: string;
  historicalExperienceId?: string;
  hindsightMemoryId?: string;
  relevanceScore?: number;
  projectName: string;
  status: string;
  startDate?: string;
  endDate?: string;
  problemGoal?: string;
  whatWasAttempted?: string;
  approachUsed?: string;
  whatHappened?: string;
  whatWorked?: string;
  whatFailed?: string;
  whyItFailed?: string;
  rootCause?: string;
  whyRecalled: string;
  summary: string;
  source: string;
  lessonsLearned: string;
  additionalEvidence?: string[];
  historicalExperience?: HistoricalExperience & { project?: HistoricalProject };
}

export interface PrecedentComparison {
  id: string;
  analysisId: string;
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
  precedentSummary?: string;
  createdAt: string;
}

export interface PrecedentReportData {
  analysis: ProposalAnalysis;
  comparison: PrecedentComparison | null;
  precedents: RecalledPrecedent[];
}

export interface DecisionRecord {
  id: string;
  proposalId: string;
  decision: 'Approved' | 'Rejected' | 'More Information Required' | 'Deferred';
  decisionMaker: string;
  reason: string;
  conditions?: string;
  additionalNotes?: string;
  decidedAt: string;
}

export interface ProposalOutcome {
  id: string;
  proposalId: string;
  actualResult: 'Successful' | 'Partially Successful' | 'Failed' | 'Cancelled';
  whatHappened: string;
  didPredictedRiskOccur: boolean;
  assumptionsCorrect: string;
  assumptionsWrong: string;
  whatWorked?: string;
  whatFailed?: string;
  actualRootCause?: string;
  finalLesson: string;
  futureAdvice?: string;
  recordedAt: string;
  newExperienceId?: string;
  hindsightSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  hindsightMemoryId?: string;
  hindsightSyncError?: string;
}

export interface SourceDocument {
  id: string;
  name: string;
  documentType: string;
  uploadDate: string;
  content: string;
  extractedExperienceJson?: string;
  processingStatus: 'PENDING' | 'EXTRACTED' | 'APPROVED' | 'REJECTED';
  hindsightStatus: 'PENDING' | 'SYNCED' | 'FAILED';
  hindsightMemoryId?: string;
  projectId?: string;
  createdAt: string;
}

export interface SystemStatus {
  database: {
    postgresConnected: boolean;
    postgresError: string | null;
    storageMode: string;
    counts: {
      departments: number;
      users: number;
      historicalProjects: number;
      historicalExperiences: number;
      sourceDocuments: number;
      proposals: number;
      analyses: number;
      decisions: number;
      outcomes: number;
      auditLogs: number;
    };
  };
  hindsight: {
    isConfigured: boolean;
    isAvailable: boolean;
    bankId: string;
    baseUrl: string;
    apiKeyMasked: string;
  };
  gemini: {
    isAvailable: boolean;
    model: string;
  };
  serverTime: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  timestamp: string;
}
