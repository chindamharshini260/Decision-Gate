import {
  Department,
  HistoricalProject,
  HistoricalExperience,
  Proposal,
  PrecedentReportData,
  DecisionRecord,
  ProposalOutcome,
  SourceDocument,
  SystemStatus,
  AuditLog,
} from './types.ts';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let errorMsg = `Request failed: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.error) errorMsg = body.error;
      else if (body.message) errorMsg = body.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getStatus: () => request<SystemStatus>('/status'),
  
  // Settings
  updateHindsight: (apiKey: string, bankId?: string, baseUrl?: string) =>
    request<{ success: boolean; status: any }>('/settings/hindsight', {
      method: 'POST',
      body: JSON.stringify({ apiKey, bankId, baseUrl }),
    }),

  // Departments
  getDepartments: () => request<Department[]>('/departments'),
  createDepartment: (name: string, code: string, description?: string) =>
    request<Department>('/departments', {
      method: 'POST',
      body: JSON.stringify({ name, code, description }),
    }),

  // Historical Projects & Experiences
  getHistoricalProjects: () => request<(HistoricalProject & { experiences: HistoricalExperience[]; department?: Department })[]>('/historical-projects'),
  getHistoricalProjectById: (id: string) =>
    request<HistoricalProject & { experiences: HistoricalExperience[]; department?: Department }>(`/historical-projects/${id}`),
  getHistoricalExperienceById: (id: string) =>
    request<HistoricalExperience & { project: HistoricalProject; sourceDocument?: SourceDocument }>(`/experiences/${id}`),
  
  extractExperience: (text: string) =>
    request<any>('/extract/experience', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  checkDuplicate: (projectName: string, problemGoal: string, whatWasAttempted: string) =>
    request<{ isDuplicate: boolean; existingProject?: HistoricalProject; existingExperience?: HistoricalExperience; reason?: string }>('/check-duplicate', {
      method: 'POST',
      body: JSON.stringify({ projectName, problemGoal, whatWasAttempted }),
    }),

  createHistoricalProject: (project: any, experience: any, allowDuplicate = false) =>
    request<{ project: HistoricalProject; experience: HistoricalExperience; hindsight: any }>('/historical-projects', {
      method: 'POST',
      body: JSON.stringify({ project, experience, allowDuplicate }),
    }),

  retryHindsightSync: (experienceId: string) =>
    request<{ success: boolean; experience: HistoricalExperience; message: string }>(`/experiences/${experienceId}/retry-hindsight-sync`, {
      method: 'POST',
    }),

  // Documents
  getDocuments: () => request<SourceDocument[]>('/documents'),
  uploadDocument: (name: string, documentType: string, content: string) =>
    request<SourceDocument>('/documents', {
      method: 'POST',
      body: JSON.stringify({ name, documentType, content }),
    }),
  extractDocument: (id: string) =>
    request<{ document: SourceDocument; extracted: any }>(`/documents/${id}/extract`, {
      method: 'POST',
    }),

  // Proposals
  getProposals: () => request<Proposal[]>('/proposals'),
  getProposalById: (id: string) => request<Proposal>(`/proposals/${id}`),
  extractProposal: (text: string) =>
    request<any>('/extract/proposal', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  createProposal: (data: Partial<Proposal>) =>
    request<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Precedent Analysis
  runPrecedentAnalysis: (proposalId: string) =>
    request<any>(`/proposals/${proposalId}/analyze`, {
      method: 'POST',
    }),
  getPrecedentReport: (proposalId: string) =>
    request<PrecedentReportData>(`/proposals/${proposalId}/precedent-report`),

  // Decision
  recordDecision: (proposalId: string, decision: string, decisionMaker: string, reason: string, conditions?: string, additionalNotes?: string) =>
    request<DecisionRecord>(`/proposals/${proposalId}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision, decisionMaker, reason, conditions, additionalNotes }),
    }),

  // Outcome
  recordOutcome: (proposalId: string, outcomeData: any) =>
    request<{ outcome: ProposalOutcome; newProject: HistoricalProject; newExperience: HistoricalExperience; hindsight: any }>(`/proposals/${proposalId}/outcome`, {
      method: 'POST',
      body: JSON.stringify(outcomeData),
    }),

  // Insights & Audit
  getInsights: () => request<any>('/insights'),
  getAuditLogs: (limit = 50) => request<AuditLog[]>(`/audit-logs?limit=${limit}`),

  // Demo Controls
  loadDemoData: () => request<{ success: boolean; message: string }>('/demo/load', { method: 'POST' }),
  clearAllData: () => request<{ success: boolean; message: string }>('/demo/clear', { method: 'POST' }),
};
