import { HindsightClient } from '@vectorize-io/hindsight-client';

export interface HindsightConfig {
  apiKey: string;
  baseUrl: string;
  bankId: string;
}

export interface RetainExperiencePayload {
  experienceId: string;
  projectName: string;
  department?: string;
  status: string;
  problemGoal: string;
  whatWasAttempted: string;
  approachUsed: string;
  whatHappened: string;
  whatWorked?: string;
  whatFailed?: string;
  whyItFailed?: string;
  rootCause?: string;
  constraints?: string;
  lessonsLearned: string;
  futureConditions?: string;
  source: string;
}

export interface RecallResultItem {
  id: string;
  text: string;
  type?: string;
  context?: string;
  score?: number;
  metadata?: Record<string, any>;
  tags?: string[];
  documentId?: string;
}

export interface HindsightRecallResponse {
  success: boolean;
  isAvailable: boolean;
  statusMessage: string;
  bankId: string;
  results: RecallResultItem[];
  rawCount: number;
  error?: string;
}

export interface HindsightRetainResponse {
  success: boolean;
  isAvailable: boolean;
  memoryId?: string;
  bankId: string;
  statusMessage: string;
  error?: string;
}

export interface HindsightReflectResponse {
  success: boolean;
  isAvailable: boolean;
  synthesis?: string;
  bankId: string;
  error?: string;
}

class HindsightService {
  private client: HindsightClient | null = null;
  private config: HindsightConfig;

  constructor() {
    this.config = {
      apiKey: process.env.HINDSIGHT_API_KEY || '',
      baseUrl: process.env.HINDSIGHT_BASE_URL || 'https://api.hindsight.vectorize.io',
      bankId: process.env.HINDSIGHT_BANK_ID || 'decision-gate-memory',
    };

    if (this.config.apiKey) {
      try {
        this.client = new HindsightClient({
          baseUrl: this.config.baseUrl,
          apiKey: this.config.apiKey,
          userAgent: 'decision-gate/1.0.0',
        });
      } catch (err) {
        console.error('Failed to initialize Hindsight client:', err);
      }
    }
  }

  public updateCredentials(apiKey: string, bankId?: string, baseUrl?: string) {
    this.config.apiKey = apiKey;
    if (bankId) this.config.bankId = bankId;
    if (baseUrl) this.config.baseUrl = baseUrl;

    try {
      this.client = new HindsightClient({
        baseUrl: this.config.baseUrl,
        apiKey: this.config.apiKey,
        userAgent: 'decision-gate/1.0.0',
      });
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  }

  public getStatus() {
    const isConfigured = Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
    return {
      isConfigured,
      isAvailable: isConfigured && Boolean(this.client),
      bankId: this.config.bankId,
      baseUrl: this.config.baseUrl,
      apiKeyMasked: this.config.apiKey ? `${this.config.apiKey.slice(0, 4)}...${this.config.apiKey.slice(-4)}` : 'Not set',
    };
  }

  /**
   * RETAIN:
   * Store historical project experiences and organizational knowledge into Hindsight.
   * As specified: focuses on previous project attempts, decisions, outcomes, failures,
   * root causes, lessons learned, constraints, and future conditions.
   */
  public async retainHistoricalExperience(payload: RetainExperiencePayload): Promise<HindsightRetainResponse> {
    if (!this.client || !this.config.apiKey) {
      return {
        success: false,
        isAvailable: false,
        bankId: this.config.bankId,
        statusMessage: 'Organizational memory is currently unavailable: HINDSIGHT_API_KEY is not configured on server.',
        error: 'HINDSIGHT_API_KEY is not set.',
      };
    }

    try {
      // Build meaningful narrative for Hindsight's knowledge graph & entity extraction
      const content = [
        `ORGANIZATIONAL HISTORICAL EXPERIENCE RECORD:`,
        `Project / Initiative: "${payload.projectName}"`,
        `Department: ${payload.department || 'General'}`,
        `Historical Outcome / Status: ${payload.status}`,
        `Problem / Goal Attempted: ${payload.problemGoal}`,
        `What Was Attempted: ${payload.whatWasAttempted}`,
        `Approach Used: ${payload.approachUsed}`,
        `What Actually Happened: ${payload.whatHappened}`,
        payload.whatWorked ? `What Worked: ${payload.whatWorked}` : null,
        payload.whatFailed ? `What Failed: ${payload.whatFailed}` : null,
        payload.whyItFailed ? `Why It Failed: ${payload.whyItFailed}` : null,
        payload.rootCause ? `Root Cause of Failure: ${payload.rootCause}` : null,
        payload.constraints ? `Key Constraints: ${payload.constraints}` : null,
        `Lessons Learned: ${payload.lessonsLearned}`,
        payload.futureConditions ? `Conditions for Future Success: ${payload.futureConditions}` : null,
        `Documented Source: ${payload.source}`,
      ].filter(Boolean).join('\n\n');

      const context = `Decision Gate Organizational Precedent for initiative: ${payload.projectName}. Status: ${payload.status}. Source: ${payload.source}`;

      const res = await this.client.retain(this.config.bankId, content, {
        documentId: payload.experienceId,
        context,
        tags: [
          'precedent',
          payload.status.toLowerCase().replace(/\s+/g, '-'),
          (payload.department || 'general').toLowerCase().replace(/\s+/g, '-'),
        ],
        metadata: {
          projectName: payload.projectName,
          status: payload.status,
          experienceId: payload.experienceId,
          source: payload.source,
        },
      });

      return {
        success: true,
        isAvailable: true,
        bankId: this.config.bankId,
        memoryId: (res as any)?.operation_id || (res as any)?.id || payload.experienceId,
        statusMessage: 'Successfully retained in Hindsight organizational memory bank.',
      };
    } catch (error: any) {
      console.error('Hindsight retain error:', error);
      return {
        success: false,
        isAvailable: true,
        bankId: this.config.bankId,
        statusMessage: 'Organizational memory synchronization failed in Hindsight.',
        error: error?.message || 'Hindsight retain API request failed.',
      };
    }
  }

  /**
   * RECALL:
   * Retrieve experiences relevant to a new proposal.
   * Multi-strategy TEMPR retrieval: semantic similarity, keyword matching,
   * graph traversal of failure/success links.
   */
  public async recallRelevantPrecedents(query: string, limit = 8): Promise<HindsightRecallResponse> {
    if (!this.client || !this.config.apiKey) {
      return {
        success: false,
        isAvailable: false,
        statusMessage: 'Organizational memory is currently unavailable: Hindsight is not configured.',
        bankId: this.config.bankId,
        results: [],
        rawCount: 0,
        error: 'HINDSIGHT_API_KEY is not configured on the server.',
      };
    }

    try {
      const res: any = await this.client.recall(this.config.bankId, query, {
        types: ['experience', 'world', 'observation'],
        budget: 'mid' as any,
        tags: ['precedent'],
      });

      // The SDK returns structured facts or items
      const rawFacts = res?.facts || res?.results || res?.memories || [];
      const results: RecallResultItem[] = rawFacts.map((fact: any) => ({
        id: fact.id || fact.memory_id || fact.fact_id || String(Math.random()),
        text: fact.text || fact.content || fact.summary || JSON.stringify(fact),
        type: fact.type || 'experience',
        context: fact.context || fact.provenance,
        score: fact.score || fact.relevance_score || 0.85,
        metadata: fact.metadata || {},
        tags: fact.tags || [],
        documentId: fact.document_id || fact.documentId,
      }));

      return {
        success: true,
        isAvailable: true,
        statusMessage: results.length > 0 ? `Retrieved ${results.length} historical experiences from Hindsight.` : 'Hindsight recall returned 0 matching memories.',
        bankId: this.config.bankId,
        results: results.slice(0, limit),
        rawCount: results.length,
      };
    } catch (error: any) {
      console.error('Hindsight recall error:', error);
      return {
        success: false,
        isAvailable: false,
        statusMessage: 'Organizational memory recall encountered an error with Hindsight.',
        bankId: this.config.bankId,
        results: [],
        rawCount: 0,
        error: error?.message || 'Hindsight recall failed.',
      };
    }
  }

  /**
   * REFLECT:
   * Agentic reasoning across organizational precedents to synthesize
   * historical experience and patterns.
   */
  public async reflectOnHistoricalEvidence(query: string, context?: string): Promise<HindsightReflectResponse> {
    if (!this.client || !this.config.apiKey) {
      return {
        success: false,
        isAvailable: false,
        bankId: this.config.bankId,
        error: 'Hindsight credentials not configured.',
      };
    }

    try {
      const res: any = await this.client.reflect(this.config.bankId, query, {
        context,
        budget: 'mid' as any,
      });

      return {
        success: true,
        isAvailable: true,
        bankId: this.config.bankId,
        synthesis: res?.response || res?.answer || res?.text || (typeof res === 'string' ? res : JSON.stringify(res)),
      };
    } catch (error: any) {
      console.error('Hindsight reflect error:', error);
      return {
        success: false,
        isAvailable: true,
        bankId: this.config.bankId,
        error: error?.message || 'Hindsight reflect API call failed.',
      };
    }
  }
}

export const hindsightService = new HindsightService();
