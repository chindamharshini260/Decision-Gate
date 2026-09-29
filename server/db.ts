import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { randomUUID as uuidv4 } from 'crypto';

const { Pool } = pg;

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
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

export interface Proposal {
  id: string;
  title: string;
  submittedBy: string;
  userId?: string;
  departmentId?: string;
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
  whyRecalled: string;
  summary: string;
  content: string;
  retrievedAt: string;
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
  evidenceQuality: string;
  createdAt: string;
}

export interface DecisionRecord {
  id: string;
  proposalId: string;
  decision: 'Approved' | 'Rejected' | 'More Information Required' | 'Deferred';
  decisionMaker: string;
  userId?: string;
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

export interface KnowledgeLink {
  id: string;
  sourceExpId: string;
  targetExpId: string;
  linkType: string;
  description?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: string;
  timestamp: string;
}

export interface HindsightSync {
  id: string;
  entityType: string;
  entityId: string;
  operation: 'RETAIN' | 'RECALL' | 'REFLECT';
  status: 'PENDING' | 'SYNCED' | 'FAILED';
  memoryId?: string;
  error?: string;
  timestamp: string;
}

interface DatabaseSchema {
  departments: Department[];
  users: User[];
  historicalProjects: HistoricalProject[];
  historicalExperiences: HistoricalExperience[];
  sourceDocuments: SourceDocument[];
  proposals: Proposal[];
  proposalAnalyses: ProposalAnalysis[];
  recalledPrecedents: RecalledPrecedent[];
  precedentComparisons: PrecedentComparison[];
  decisionRecords: DecisionRecord[];
  proposalOutcomes: ProposalOutcome[];
  knowledgeLinks: KnowledgeLink[];
  auditLogs: AuditLog[];
  hindsightSyncs: HindsightSync[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// Ensure empty database state initially
function getEmptyDatabase(): DatabaseSchema {
  return {
    departments: [],
    users: [],
    historicalProjects: [],
    historicalExperiences: [],
    sourceDocuments: [],
    proposals: [],
    proposalAnalyses: [],
    recalledPrecedents: [],
    precedentComparisons: [],
    decisionRecords: [],
    proposalOutcomes: [],
    knowledgeLinks: [],
    auditLogs: [],
    hindsightSyncs: [],
  };
}

class RelationalDatabase {
  private pgPool: pg.Pool | null = null;
  private isPostgresAvailable = false;
  private postgresInitError: string | null = null;
  private localData: DatabaseSchema;

  constructor() {
    this.localData = this.loadLocalData();
    this.initPostgres();
  }

  private loadLocalData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('Could not load local data file, initializing empty:', e);
    }
    const empty = getEmptyDatabase();
    this.saveLocalData(empty);
    return empty;
  }

  private saveLocalData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save data locally:', e);
    }
  }

  private async initPostgres() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.isPostgresAvailable = false;
      this.postgresInitError = 'DATABASE_URL environment variable is not defined.';
      return;
    }

    try {
      this.pgPool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await this.pgPool.connect();
      client.release();
      this.isPostgresAvailable = true;
      this.postgresInitError = null;
      console.log('Connected to PostgreSQL successfully.');
      await this.ensurePostgresTables();
    } catch (error: any) {
      this.isPostgresAvailable = false;
      this.postgresInitError = error?.message || 'Failed to connect to PostgreSQL.';
      console.warn('PostgreSQL unavailable, operating in local persistent relational mode:', this.postgresInitError);
    }
  }

  private async ensurePostgresTables() {
    if (!this.pgPool || !this.isPostgresAvailable) return;
    try {
      await this.pgPool.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          code TEXT NOT NULL,
          description TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'DECISION_MAKER',
          department_id TEXT REFERENCES departments(id),
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS historical_projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          department_id TEXT REFERENCES departments(id),
          project_type TEXT NOT NULL,
          start_date TEXT,
          end_date TEXT,
          status TEXT NOT NULL,
          problem_goal TEXT NOT NULL,
          source_doc_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS historical_experiences (
          id TEXT PRIMARY KEY,
          project_id TEXT REFERENCES historical_projects(id) ON DELETE CASCADE,
          problem_goal TEXT NOT NULL,
          what_was_attempted TEXT NOT NULL,
          approach_used TEXT NOT NULL,
          what_happened TEXT NOT NULL,
          what_worked TEXT,
          what_failed TEXT,
          why_it_failed TEXT,
          root_cause TEXT,
          constraints TEXT,
          important_decisions TEXT,
          what_would_we_do_differently TEXT,
          lessons_learned TEXT NOT NULL,
          future_conditions TEXT,
          source TEXT NOT NULL,
          source_document_id TEXT,
          hindsight_memory_id TEXT,
          hindsight_sync_status TEXT DEFAULT 'PENDING',
          hindsight_synced_at TIMESTAMPTZ,
          hindsight_sync_error TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS source_documents (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          document_type TEXT NOT NULL,
          upload_date TIMESTAMPTZ DEFAULT NOW(),
          content TEXT NOT NULL,
          extracted_experience_json TEXT,
          processing_status TEXT DEFAULT 'PENDING',
          hindsight_status TEXT DEFAULT 'PENDING',
          hindsight_memory_id TEXT,
          project_id TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS proposals (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          submitted_by TEXT NOT NULL,
          user_id TEXT REFERENCES users(id),
          department_id TEXT REFERENCES departments(id),
          problem_being_solved TEXT NOT NULL,
          proposed_solution TEXT NOT NULL,
          target_users TEXT NOT NULL,
          expected_outcome TEXT NOT NULL,
          technology_approach TEXT NOT NULL,
          estimated_scope TEXT,
          known_risks TEXT,
          dependencies TEXT,
          why_believe_it_will_work TEXT,
          what_is_different_from_previous TEXT,
          success_criteria TEXT,
          raw_text TEXT,
          status TEXT DEFAULT 'DRAFT',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS proposal_analyses (
          id TEXT PRIMARY KEY,
          proposal_id TEXT REFERENCES proposals(id) ON DELETE CASCADE,
          query_used TEXT NOT NULL,
          memory_status TEXT DEFAULT 'CONNECTED',
          memories_recalled_count INT DEFAULT 0,
          precedent_found BOOLEAN DEFAULT FALSE,
          unresolved_questions JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS recalled_precedents (
          id TEXT PRIMARY KEY,
          analysis_id TEXT REFERENCES proposal_analyses(id) ON DELETE CASCADE,
          historical_experience_id TEXT REFERENCES historical_experiences(id),
          hindsight_memory_id TEXT,
          relevance_score FLOAT,
          why_recalled TEXT NOT NULL,
          summary TEXT NOT NULL,
          content TEXT NOT NULL,
          retrieved_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS precedent_comparisons (
          id TEXT PRIMARY KEY,
          analysis_id TEXT UNIQUE REFERENCES proposal_analyses(id) ON DELETE CASCADE,
          problem_similarity TEXT NOT NULL,
          solution_similarity TEXT NOT NULL,
          target_user_similarity TEXT NOT NULL,
          technology_similarity TEXT NOT NULL,
          operational_similarity TEXT NOT NULL,
          constraint_similarity TEXT NOT NULL,
          expected_outcome_similarity TEXT NOT NULL,
          historical_failure_conditions JSONB,
          failure_conditions_assessment JSONB,
          historical_success_conditions JSONB,
          what_has_changed TEXT NOT NULL,
          unresolved_questions JSONB,
          ai_inference_notes TEXT NOT NULL,
          evidence_quality TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS decision_records (
          id TEXT PRIMARY KEY,
          proposal_id TEXT UNIQUE REFERENCES proposals(id) ON DELETE CASCADE,
          decision TEXT NOT NULL,
          decision_maker TEXT NOT NULL,
          user_id TEXT REFERENCES users(id),
          reason TEXT NOT NULL,
          conditions TEXT,
          additional_notes TEXT,
          decided_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS proposal_outcomes (
          id TEXT PRIMARY KEY,
          proposal_id TEXT UNIQUE REFERENCES proposals(id) ON DELETE CASCADE,
          actual_result TEXT NOT NULL,
          what_happened TEXT NOT NULL,
          did_predicted_risk_occur BOOLEAN NOT NULL,
          assumptions_correct TEXT NOT NULL,
          assumptions_wrong TEXT NOT NULL,
          what_worked TEXT,
          what_failed TEXT,
          actual_root_cause TEXT,
          final_lesson TEXT NOT NULL,
          future_advice TEXT,
          recorded_at TIMESTAMPTZ DEFAULT NOW(),
          new_experience_id TEXT,
          hindsight_sync_status TEXT DEFAULT 'PENDING',
          hindsight_memory_id TEXT,
          hindsight_sync_error TEXT
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id TEXT PRIMARY KEY,
          action TEXT NOT NULL,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          details TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS hindsight_syncs (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          status TEXT NOT NULL,
          memory_id TEXT,
          error TEXT,
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );
      `);
    } catch (e) {
      console.error('Error creating PostgreSQL tables:', e);
    }
  }

  public getStatus() {
    return {
      postgresConnected: this.isPostgresAvailable,
      postgresError: this.postgresInitError,
      storageMode: this.isPostgresAvailable ? 'PostgreSQL' : 'Local Persistent Relational (Active)',
      counts: {
        departments: this.localData.departments.length,
        users: this.localData.users.length,
        historicalProjects: this.localData.historicalProjects.length,
        historicalExperiences: this.localData.historicalExperiences.length,
        sourceDocuments: this.localData.sourceDocuments.length,
        proposals: this.localData.proposals.length,
        analyses: this.localData.proposalAnalyses.length,
        decisions: this.localData.decisionRecords.length,
        outcomes: this.localData.proposalOutcomes.length,
        auditLogs: this.localData.auditLogs.length,
      },
    };
  }

  // --- Audit Log ---
  public async logAudit(action: string, entityType: string, entityId: string, details?: any) {
    const entry: AuditLog = {
      id: uuidv4(),
      action,
      entityType,
      entityId,
      details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : undefined,
      timestamp: new Date().toISOString(),
    };
    this.localData.auditLogs.unshift(entry);
    this.saveLocalData(this.localData);

    if (this.isPostgresAvailable && this.pgPool) {
      try {
        await this.pgPool.query(
          `INSERT INTO audit_logs (id, action, entity_type, entity_id, details, timestamp) VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.id, entry.action, entry.entityType, entry.entityId, entry.details, entry.timestamp]
        );
      } catch (err) {
        console.warn('PG audit log error:', err);
      }
    }
    return entry;
  }

  public getAuditLogs(limit = 50): AuditLog[] {
    return this.localData.auditLogs.slice(0, limit);
  }

  // --- Departments ---
  public async getDepartments(): Promise<Department[]> {
    return this.localData.departments;
  }

  public async createDepartment(name: string, code: string, description?: string): Promise<Department> {
    const dept: Department = {
      id: uuidv4(),
      name,
      code,
      description,
      createdAt: new Date().toISOString(),
    };
    this.localData.departments.push(dept);
    this.saveLocalData(this.localData);
    await this.logAudit('DEPARTMENT_CREATED', 'Department', dept.id, { name, code });
    return dept;
  }

  // --- Historical Projects & Experiences ---
  public async getHistoricalProjects(): Promise<(HistoricalProject & { experiences: HistoricalExperience[]; department?: Department })[]> {
    return this.localData.historicalProjects.map(proj => {
      const experiences = this.localData.historicalExperiences.filter(exp => exp.projectId === proj.id);
      const department = this.localData.departments.find(d => d.id === proj.departmentId);
      return {
        ...proj,
        experiences,
        department,
      };
    });
  }

  public async getHistoricalProjectById(id: string): Promise<(HistoricalProject & { experiences: HistoricalExperience[]; department?: Department }) | null> {
    const proj = this.localData.historicalProjects.find(p => p.id === id);
    if (!proj) return null;
    const experiences = this.localData.historicalExperiences.filter(exp => exp.projectId === proj.id);
    const department = this.localData.departments.find(d => d.id === proj.departmentId);
    return {
      ...proj,
      experiences,
      department,
    };
  }

  // Duplicate Prevention Check
  public checkDuplicateExperience(projectName: string, problemGoal: string, whatWasAttempted: string): { isDuplicate: boolean; existingExperience?: HistoricalExperience; existingProject?: HistoricalProject; reason?: string } {
    const normName = projectName.trim().toLowerCase();
    const existingProject = this.localData.historicalProjects.find(p => p.name.trim().toLowerCase() === normName);

    if (existingProject) {
      const existingExperience = this.localData.historicalExperiences.find(e => e.projectId === existingProject.id);
      if (existingExperience) {
        return {
          isDuplicate: true,
          existingExperience,
          existingProject,
          reason: `A historical experience for project "${existingProject.name}" already exists in the system.`,
        };
      }
    }

    // Check textual overlap
    const normAttempted = whatWasAttempted.trim().toLowerCase();
    for (const exp of this.localData.historicalExperiences) {
      if (exp.whatWasAttempted && normAttempted.length > 20 && exp.whatWasAttempted.toLowerCase().includes(normAttempted.slice(0, 40))) {
        const proj = this.localData.historicalProjects.find(p => p.id === exp.projectId);
        return {
          isDuplicate: true,
          existingExperience: exp,
          existingProject: proj,
          reason: `High textual similarity with existing project attempt "${proj?.name || 'Unknown'}".`,
        };
      }
    }

    return { isDuplicate: false };
  }

  public async createHistoricalProjectAndExperience(projectData: Omit<HistoricalProject, 'id' | 'createdAt' | 'updatedAt'>, experienceData: Omit<HistoricalExperience, 'id' | 'projectId' | 'createdAt' | 'updatedAt' | 'hindsightMemoryId' | 'hindsightSyncStatus' | 'hindsightSyncedAt' | 'hindsightSyncError'>, hindsightMemoryId?: string): Promise<{ project: HistoricalProject; experience: HistoricalExperience }> {
    const now = new Date().toISOString();
    const projectId = uuidv4();
    const experienceId = uuidv4();

    const project: HistoricalProject = {
      ...projectData,
      id: projectId,
      createdAt: now,
      updatedAt: now,
    };

    const experience: HistoricalExperience = {
      ...experienceData,
      id: experienceId,
      projectId,
      hindsightMemoryId: hindsightMemoryId || undefined,
      hindsightSyncStatus: hindsightMemoryId ? 'SYNCED' : 'PENDING',
      hindsightSyncedAt: hindsightMemoryId ? now : undefined,
      createdAt: now,
      updatedAt: now,
    };

    this.localData.historicalProjects.push(project);
    this.localData.historicalExperiences.push(experience);
    this.saveLocalData(this.localData);

    await this.logAudit('HISTORICAL_EXPERIENCE_CREATED', 'HistoricalExperience', experienceId, {
      projectName: project.name,
      hindsightSyncStatus: experience.hindsightSyncStatus,
    });

    return { project, experience };
  }

  public async updateExperienceHindsightStatus(experienceId: string, status: 'PENDING' | 'SYNCED' | 'FAILED', memoryId?: string, error?: string): Promise<HistoricalExperience | null> {
    const exp = this.localData.historicalExperiences.find(e => e.id === experienceId);
    if (!exp) return null;

    exp.hindsightSyncStatus = status;
    exp.updatedAt = new Date().toISOString();
    if (memoryId) {
      exp.hindsightMemoryId = memoryId;
      exp.hindsightSyncedAt = new Date().toISOString();
      exp.hindsightSyncError = undefined;
    }
    if (error) {
      exp.hindsightSyncError = error;
    }

    this.saveLocalData(this.localData);

    const syncLog: HindsightSync = {
      id: uuidv4(),
      entityType: 'HistoricalExperience',
      entityId: experienceId,
      operation: 'RETAIN',
      status,
      memoryId,
      error,
      timestamp: new Date().toISOString(),
    };
    this.localData.hindsightSyncs.push(syncLog);
    this.saveLocalData(this.localData);

    await this.logAudit(status === 'SYNCED' ? 'HINDSIGHT_SYNC_SUCCESS' : 'HINDSIGHT_SYNC_FAILED', 'HistoricalExperience', experienceId, { memoryId, error });
    return exp;
  }

  public async getHistoricalExperienceById(id: string): Promise<(HistoricalExperience & { project: HistoricalProject; sourceDocument?: SourceDocument }) | null> {
    const exp = this.localData.historicalExperiences.find(e => e.id === id);
    if (!exp) return null;
    const project = this.localData.historicalProjects.find(p => p.id === exp.projectId);
    if (!project) return null;
    const sourceDocument = exp.sourceDocumentId ? this.localData.sourceDocuments.find(d => d.id === exp.sourceDocumentId) : undefined;
    return {
      ...exp,
      project,
      sourceDocument,
    };
  }

  public async getAllExperiences(): Promise<(HistoricalExperience & { project: HistoricalProject })[]> {
    return this.localData.historicalExperiences.map(exp => {
      const project = this.localData.historicalProjects.find(p => p.id === exp.projectId) || {
        id: exp.projectId,
        name: 'Unknown Project',
        projectType: 'General',
        status: 'Unknown',
        problemGoal: exp.problemGoal,
        createdAt: exp.createdAt,
        updatedAt: exp.updatedAt,
      };
      return {
        ...exp,
        project,
      };
    });
  }

  // --- Documents ---
  public async getDocuments(): Promise<SourceDocument[]> {
    return this.localData.sourceDocuments;
  }

  public async createDocument(name: string, documentType: string, content: string): Promise<SourceDocument> {
    const doc: SourceDocument = {
      id: uuidv4(),
      name,
      documentType,
      uploadDate: new Date().toISOString(),
      content,
      processingStatus: 'PENDING',
      hindsightStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    this.localData.sourceDocuments.push(doc);
    this.saveLocalData(this.localData);
    await this.logAudit('DOCUMENT_UPLOADED', 'SourceDocument', doc.id, { name, documentType });
    return doc;
  }

  public async updateDocumentExtraction(id: string, extractionJson: string, processingStatus: 'EXTRACTED' | 'APPROVED' | 'REJECTED', projectId?: string): Promise<SourceDocument | null> {
    const doc = this.localData.sourceDocuments.find(d => d.id === id);
    if (!doc) return null;
    doc.extractedExperienceJson = extractionJson;
    doc.processingStatus = processingStatus;
    if (projectId) doc.projectId = projectId;
    this.saveLocalData(this.localData);
    return doc;
  }

  // --- Proposals ---
  public async getProposals(): Promise<(Proposal & { department?: Department; decisionRecord?: DecisionRecord; outcome?: ProposalOutcome; latestAnalysis?: ProposalAnalysis })[]> {
    return this.localData.proposals.map(prop => {
      const department = this.localData.departments.find(d => d.id === prop.departmentId);
      const decisionRecord = this.localData.decisionRecords.find(d => d.proposalId === prop.id);
      const outcome = this.localData.proposalOutcomes.find(o => o.proposalId === prop.id);
      const analyses = this.localData.proposalAnalyses.filter(a => a.proposalId === prop.id);
      const latestAnalysis = analyses[analyses.length - 1];
      return {
        ...prop,
        department,
        decisionRecord,
        outcome,
        latestAnalysis,
      };
    });
  }

  public async getProposalById(id: string): Promise<(Proposal & { department?: Department; decisionRecord?: DecisionRecord; outcome?: ProposalOutcome; analyses: ProposalAnalysis[] }) | null> {
    const prop = this.localData.proposals.find(p => p.id === id);
    if (!prop) return null;
    const department = this.localData.departments.find(d => d.id === prop.departmentId);
    const decisionRecord = this.localData.decisionRecords.find(d => d.proposalId === prop.id);
    const outcome = this.localData.proposalOutcomes.find(o => o.proposalId === prop.id);
    const analyses = this.localData.proposalAnalyses.filter(a => a.proposalId === prop.id);
    return {
      ...prop,
      department,
      decisionRecord,
      outcome,
      analyses,
    };
  }

  public async createProposal(data: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<Proposal> {
    const now = new Date().toISOString();
    const proposal: Proposal = {
      ...data,
      id: uuidv4(),
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };
    this.localData.proposals.push(proposal);
    this.saveLocalData(this.localData);
    await this.logAudit('PROPOSAL_CREATED', 'Proposal', proposal.id, { title: proposal.title, submittedBy: proposal.submittedBy });
    return proposal;
  }

  public async updateProposalStatus(id: string, status: 'DRAFT' | 'ANALYZED' | 'DECIDED' | 'COMPLETED'): Promise<Proposal | null> {
    const prop = this.localData.proposals.find(p => p.id === id);
    if (!prop) return null;
    prop.status = status;
    prop.updatedAt = new Date().toISOString();
    this.saveLocalData(this.localData);
    return prop;
  }

  // --- Proposal Analysis & Precedent Report ---
  public async saveAnalysisResult(
    proposalId: string,
    queryUsed: string,
    memoryStatus: 'CONNECTED' | 'UNAVAILABLE',
    memoriesRecalledCount: number,
    precedentFound: boolean,
    unresolvedQuestions: string[],
    recalledPrecedents: Omit<RecalledPrecedent, 'id' | 'analysisId' | 'retrievedAt'>[],
    comparisonData: Omit<PrecedentComparison, 'id' | 'analysisId' | 'createdAt'> | null
  ): Promise<{ analysis: ProposalAnalysis; comparison: PrecedentComparison | null; precedents: RecalledPrecedent[] }> {
    const analysisId = uuidv4();
    const now = new Date().toISOString();

    const analysis: ProposalAnalysis = {
      id: analysisId,
      proposalId,
      queryUsed,
      memoryStatus,
      memoriesRecalledCount,
      precedentFound,
      unresolvedQuestions,
      createdAt: now,
    };
    this.localData.proposalAnalyses.push(analysis);

    const savedPrecedents: RecalledPrecedent[] = [];
    for (const p of recalledPrecedents) {
      const rec: RecalledPrecedent = {
        ...p,
        id: uuidv4(),
        analysisId,
        retrievedAt: now,
      };
      this.localData.recalledPrecedents.push(rec);
      savedPrecedents.push(rec);
    }

    let comparison: PrecedentComparison | null = null;
    if (comparisonData) {
      comparison = {
        ...comparisonData,
        id: uuidv4(),
        analysisId,
        createdAt: now,
      };
      this.localData.precedentComparisons.push(comparison);
    }

    await this.updateProposalStatus(proposalId, 'ANALYZED');
    this.saveLocalData(this.localData);

    await this.logAudit('PRECEDENT_ANALYSIS_COMPLETED', 'ProposalAnalysis', analysisId, {
      proposalId,
      precedentFound,
      memoriesRecalledCount,
      memoryStatus,
    });

    return { analysis, comparison, precedents: savedPrecedents };
  }

  public async getLatestAnalysisForProposal(proposalId: string): Promise<{ analysis: ProposalAnalysis; comparison: PrecedentComparison | null; precedents: (RecalledPrecedent & { historicalExperience?: HistoricalExperience & { project?: HistoricalProject } })[] } | null> {
    const analyses = this.localData.proposalAnalyses.filter(a => a.proposalId === proposalId);
    if (analyses.length === 0) return null;
    const latest = analyses[analyses.length - 1];

    const comparison = this.localData.precedentComparisons.find(c => c.analysisId === latest.id) || null;
    const rawPrecedents = this.localData.recalledPrecedents.filter(p => p.analysisId === latest.id);

    const precedents = rawPrecedents.map(p => {
      let historicalExperience: (HistoricalExperience & { project?: HistoricalProject }) | undefined = undefined;
      if (p.historicalExperienceId) {
        const exp = this.localData.historicalExperiences.find(e => e.id === p.historicalExperienceId);
        if (exp) {
          const project = this.localData.historicalProjects.find(prj => prj.id === exp.projectId);
          historicalExperience = { ...exp, project };
        }
      }
      return {
        ...p,
        historicalExperience,
      };
    });

    return { analysis: latest, comparison, precedents };
  }

  // --- Human Decision Record ---
  public async recordDecision(data: Omit<DecisionRecord, 'id' | 'decidedAt'>): Promise<DecisionRecord> {
    const now = new Date().toISOString();
    // Check if decision record already exists for this proposal
    const existingIndex = this.localData.decisionRecords.findIndex(d => d.proposalId === data.proposalId);
    const record: DecisionRecord = {
      ...data,
      id: uuidv4(),
      decidedAt: now,
    };

    if (existingIndex >= 0) {
      this.localData.decisionRecords[existingIndex] = record;
    } else {
      this.localData.decisionRecords.push(record);
    }

    await this.updateProposalStatus(data.proposalId, 'DECIDED');
    this.saveLocalData(this.localData);

    await this.logAudit('DECISION_RECORDED', 'DecisionRecord', record.id, {
      proposalId: record.proposalId,
      decision: record.decision,
      decisionMaker: record.decisionMaker,
    });

    return record;
  }

  // --- Outcome Feedback Loop ---
  public async recordOutcome(data: Omit<ProposalOutcome, 'id' | 'recordedAt' | 'newExperienceId' | 'hindsightSyncStatus' | 'hindsightMemoryId' | 'hindsightSyncError'>, newExperienceId?: string, hindsightMemoryId?: string, hindsightSyncStatus: 'PENDING' | 'SYNCED' | 'FAILED' = 'PENDING', hindsightSyncError?: string): Promise<ProposalOutcome> {
    const now = new Date().toISOString();
    const existingIndex = this.localData.proposalOutcomes.findIndex(o => o.proposalId === data.proposalId);
    const outcome: ProposalOutcome = {
      ...data,
      id: uuidv4(),
      recordedAt: now,
      newExperienceId,
      hindsightSyncStatus,
      hindsightMemoryId,
      hindsightSyncError,
    };

    if (existingIndex >= 0) {
      this.localData.proposalOutcomes[existingIndex] = outcome;
    } else {
      this.localData.proposalOutcomes.push(outcome);
    }

    await this.updateProposalStatus(data.proposalId, 'COMPLETED');
    this.saveLocalData(this.localData);

    await this.logAudit('OUTCOME_RECORDED', 'ProposalOutcome', outcome.id, {
      proposalId: outcome.proposalId,
      actualResult: outcome.actualResult,
      newExperienceId,
      hindsightSyncStatus,
    });

    return outcome;
  }

  // --- Knowledge Insights & Analytics (Real Data Only) ---
  public getInsights() {
    const totalProjects = this.localData.historicalProjects.length;
    const totalExperiences = this.localData.historicalExperiences.length;
    const totalProposals = this.localData.proposals.length;
    const totalDecisions = this.localData.decisionRecords.length;
    const totalOutcomes = this.localData.proposalOutcomes.length;

    if (totalProjects === 0 && totalExperiences === 0 && totalProposals === 0) {
      return {
        hasData: false,
        message: 'Not enough organizational data yet. Add your first historical project or proposal to begin generating knowledge insights.',
      };
    }

    // Success vs Failure counts
    const successfulProjects = this.localData.historicalProjects.filter(p => p.status === 'Successful').length;
    const failedProjects = this.localData.historicalProjects.filter(p => p.status === 'Failed' || p.status === 'Cancelled').length;
    const partialProjects = this.localData.historicalProjects.filter(p => p.status === 'Partially Successful').length;

    // Recalled precedents frequency
    const experienceRecallCounts: Record<string, number> = {};
    for (const r of this.localData.recalledPrecedents) {
      if (r.historicalExperienceId) {
        experienceRecallCounts[r.historicalExperienceId] = (experienceRecallCounts[r.historicalExperienceId] || 0) + 1;
      }
    }

    const referencedExperiences = Object.entries(experienceRecallCounts)
      .map(([id, count]) => {
        const exp = this.localData.historicalExperiences.find(e => e.id === id);
        const proj = exp ? this.localData.historicalProjects.find(p => p.id === exp.projectId) : undefined;
        return {
          experienceId: id,
          projectName: proj?.name || 'Unknown',
          recallCount: count,
          status: proj?.status || 'Unknown',
          lessonsLearned: exp?.lessonsLearned || '',
        };
      })
      .sort((a, b) => b.recallCount - a.recallCount);

    // Root causes summary
    const rootCauses = this.localData.historicalExperiences
      .filter(e => e.rootCause && e.rootCause.trim().length > 0)
      .map(e => {
        const proj = this.localData.historicalProjects.find(p => p.id === e.projectId);
        return {
          projectName: proj?.name || 'Unknown',
          rootCause: e.rootCause!,
          status: proj?.status || 'Unknown',
        };
      });

    // Departments with knowledge
    const deptKnowledge: Record<string, { name: string; projectCount: number; proposalCount: number }> = {};
    for (const d of this.localData.departments) {
      deptKnowledge[d.id] = { name: d.name, projectCount: 0, proposalCount: 0 };
    }
    for (const p of this.localData.historicalProjects) {
      if (p.departmentId && deptKnowledge[p.departmentId]) {
        deptKnowledge[p.departmentId].projectCount++;
      }
    }
    for (const p of this.localData.proposals) {
      if (p.departmentId && deptKnowledge[p.departmentId]) {
        deptKnowledge[p.departmentId].proposalCount++;
      }
    }

    // Decisions breakdown
    const decisionBreakdown = {
      approved: this.localData.decisionRecords.filter(d => d.decision === 'Approved').length,
      rejected: this.localData.decisionRecords.filter(d => d.decision === 'Rejected').length,
      moreInfo: this.localData.decisionRecords.filter(d => d.decision === 'More Information Required').length,
      deferred: this.localData.decisionRecords.filter(d => d.decision === 'Deferred').length,
    };

    return {
      hasData: true,
      stats: {
        totalProjects,
        totalExperiences,
        successfulProjects,
        failedProjects,
        partialProjects,
        totalProposals,
        totalDecisions,
        totalOutcomes,
        precedentsRecalledCount: this.localData.recalledPrecedents.length,
      },
      mostReferencedExperiences: referencedExperiences.slice(0, 5),
      rootCauses: rootCauses.slice(0, 8),
      departmentDistribution: Object.values(deptKnowledge),
      decisionBreakdown,
    };
  }

  // --- Seed Demo Data (Explicit user request only) ---
  public async loadDemoData(): Promise<void> {
    const now = new Date().toISOString();
    const supportDept: Department = {
      id: uuidv4(),
      name: 'Customer Operations',
      code: 'CUST-OPS',
      description: 'Support, Success, and Customer Service automation',
      createdAt: now,
    };
    const productDept: Department = {
      id: uuidv4(),
      name: 'Product & Engineering',
      code: 'PROD-ENG',
      description: 'Core application product teams and platform architecture',
      createdAt: now,
    };

    this.localData.departments = [supportDept, productDept];

    // Historical Project 1: Customer Support Chatbot
    const proj1Id = uuidv4();
    const proj1: HistoricalProject = {
      id: proj1Id,
      name: 'Customer Support Chatbot',
      departmentId: supportDept.id,
      projectType: 'AI Customer Support',
      startDate: '2024-01-15',
      endDate: '2024-06-30',
      status: 'Cancelled',
      problemGoal: 'Automate tier-1 customer inquiries to reduce ticket resolution time and support staff burnout.',
      createdAt: now,
      updatedAt: now,
    };

    const exp1: HistoricalExperience = {
      id: uuidv4(),
      projectId: proj1Id,
      problemGoal: 'Automate tier-1 customer inquiries to reduce ticket resolution time and support staff burnout.',
      whatWasAttempted: 'Deployed an automated AI chatbot across web and mobile help centers to resolve customer inquiries end-to-end.',
      approachUsed: 'Direct LLM responses on general company documentation with no structured human escalation path.',
      whatHappened: 'Customers frequently asked complicated billing, account migration, and dispute questions. The chatbot hallucinated billing credits and could not resolve edge cases.',
      whatWorked: 'Handled standard FAQs (business hours, refund policies) adequately.',
      whatFailed: 'Failed dramatically on complex billing cases, creating angry escalations to executive email channels.',
      whyItFailed: 'The chatbot could not reliably handle complex billing cases and there was no effective human escalation or tier-2 handoff path.',
      rootCause: 'Lack of human-in-the-loop escalation criteria, absence of real-time account ledger validation, and unconstrained problem scope.',
      constraints: 'Strict customer privacy regulations; support team lacked dedicated AI ops engineers.',
      importantDecisions: 'Decided to deploy company-wide before piloting with a restricted subset of FAQ queries.',
      whatWouldWeDoDifferently: 'Require deterministic escalation triggers when billing thresholds exceed $50, and establish a warm-handoff protocol to live agents.',
      lessonsLearned: 'For billing-related AI assistants, complex cases require mandatory human escalation and strict scope boundaries.',
      futureConditions: 'Can only succeed if scoped exclusively to standard FAQs with automated handoff when user sentiment drops or financial transactions are queried.',
      source: 'Postmortem — Customer Support Chatbot Incident Review',
      hindsightSyncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    // Historical Project 2: Self-Service Cloud Cost Optimizer
    const proj2Id = uuidv4();
    const proj2: HistoricalProject = {
      id: proj2Id,
      name: 'Self-Service Cloud Cost Optimizer',
      departmentId: productDept.id,
      projectType: 'Infrastructure Automation',
      startDate: '2024-04-01',
      endDate: '2024-11-15',
      status: 'Successful',
      problemGoal: 'Reduce idle cloud compute resources across staging and test environments.',
      createdAt: now,
      updatedAt: now,
    };

    const exp2: HistoricalExperience = {
      id: uuidv4(),
      projectId: proj2Id,
      problemGoal: 'Reduce idle cloud compute resources across staging and test environments.',
      whatWasAttempted: 'Built a CLI and automated cron scheduler for engineering squads to shut down idle testing clusters over weekends.',
      approachUsed: 'Opt-in policy with Slack notifications and dry-run period before any resource deletion.',
      whatHappened: 'Squads adopted the scheduler smoothly because warnings were broadcast 24h prior, and engineers could snooze scheduled shutdowns with 1 click.',
      whatWorked: 'Clear opt-out safeguards, non-destructive initial trial phase, and active Slack bot notifications.',
      whatFailed: 'Initial documentation was too sparse, requiring an engineering demo session.',
      whyItFailed: '',
      rootCause: '',
      constraints: 'Zero disruption to production pipelines.',
      importantDecisions: 'Opt-in instead of mandated executive decree; built snooze toggle.',
      whatWouldWeDoDifferently: 'Provide self-service dashboard earlier.',
      lessonsLearned: 'Automation that affects team workflows succeeds when engineers retain control and receive transparent advance notifications.',
      futureConditions: 'Applies to any internal developer efficiency or resource management tool.',
      source: 'Project Retrospective — Infrastructure Q3 Summary',
      hindsightSyncStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };

    this.localData.historicalProjects = [proj1, proj2];
    this.localData.historicalExperiences = [exp1, exp2];
    this.saveLocalData(this.localData);

    await this.logAudit('DEMO_DATA_LOADED', 'System', 'demo', { countProjects: 2, countExperiences: 2 });
  }

  public async clearAllData(): Promise<void> {
    this.localData = getEmptyDatabase();
    this.saveLocalData(this.localData);
    await this.logAudit('DATABASE_RESET', 'System', 'all', { message: 'Database reset to empty state.' });
  }
}

export const db = new RelationalDatabase();
