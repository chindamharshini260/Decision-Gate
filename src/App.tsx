import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { HistoricalProjectsView } from './components/HistoricalProjectsView.tsx';
import { AddHistoricalExperienceView } from './components/AddHistoricalExperienceView.tsx';
import { HistoricalExperienceDetailView } from './components/HistoricalExperienceDetailView.tsx';
import { ProposalsListView } from './components/ProposalsListView.tsx';
import { NewProposalView } from './components/NewProposalView.tsx';
import { ProposalAnalysisView } from './components/ProposalAnalysisView.tsx';
import { KnowledgeInsightsView } from './components/KnowledgeInsightsView.tsx';
import { DocumentsView } from './components/DocumentsView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { DecisionRecordModal } from './components/DecisionRecordModal.tsx';
import { OutcomeModal } from './components/OutcomeModal.tsx';
import { DemoModal } from './components/DemoModal.tsx';
import { api } from './api.ts';
import { 
  SystemStatus, 
  HistoricalProject, 
  HistoricalExperience, 
  Proposal, 
  Department, 
  SourceDocument 
} from './types.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Modals
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [activeProposalForModal, setActiveProposalForModal] = useState<Proposal | null>(null);

  // Application Data
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [projects, setProjects] = useState<(HistoricalProject & { experiences: HistoricalExperience[] })[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);

  const refreshAllData = async () => {
    try {
      const [statusData, projectsData, proposalsData, deptsData, docsData] = await Promise.all([
        api.getStatus().catch(() => null),
        api.getHistoricalProjects().catch(() => []),
        api.getProposals().catch(() => []),
        api.getDepartments().catch(() => []),
        api.getDocuments().catch(() => []),
      ]);

      if (statusData) setSystemStatus(statusData);
      setProjects(projectsData);
      setProposals(proposalsData);
      setDepartments(deptsData);
      setDocuments(docsData);
    } catch (e) {
      console.error('Error refreshing system data:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleNavigate = (tab: string, entityId?: string) => {
    if (tab === 'historical-detail' && entityId) {
      setSelectedProjectId(entityId);
    }
    if (tab === 'proposal-analysis' && entityId) {
      setSelectedProposalId(entityId);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenDecisionModal = (proposal: Proposal) => {
    setActiveProposalForModal(proposal);
    setIsDecisionModalOpen(true);
  };

  const handleOpenOutcomeModal = (proposal: Proposal) => {
    setActiveProposalForModal(proposal);
    setIsOutcomeModalOpen(true);
  };

  const handleRetrySync = async (experienceId: string) => {
    await api.retryHindsightSync(experienceId);
    await refreshAllData();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 flex flex-col font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        status={systemStatus}
        onRefreshStatus={refreshAllData}
        onOpenDemoModal={() => setIsDemoModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            status={systemStatus}
            projects={projects}
            proposals={proposals}
            onNavigate={handleNavigate}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
        )}

        {activeTab === 'historical-projects' && (
          <HistoricalProjectsView
            projects={projects}
            onNavigate={handleNavigate}
            onRetrySync={handleRetrySync}
          />
        )}

        {activeTab === 'historical-detail' && selectedProjectId && (
          <HistoricalExperienceDetailView
            projectId={selectedProjectId}
            onNavigate={handleNavigate}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'add-experience' && (
          <AddHistoricalExperienceView
            departments={departments}
            onNavigate={handleNavigate}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'proposals' && (
          <ProposalsListView
            proposals={proposals}
            onNavigate={handleNavigate}
            onOpenOutcomeModal={handleOpenOutcomeModal}
          />
        )}

        {activeTab === 'new-proposal' && (
          <NewProposalView
            departments={departments}
            onNavigate={handleNavigate}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'proposal-analysis' && selectedProposalId && (
          <ProposalAnalysisView
            proposalId={selectedProposalId}
            onNavigate={handleNavigate}
            onOpenDecisionModal={handleOpenDecisionModal}
            onOpenOutcomeModal={handleOpenOutcomeModal}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'insights' && (
          <KnowledgeInsightsView onNavigate={handleNavigate} />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onNavigate={handleNavigate}
            onRefresh={refreshAllData}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            status={systemStatus}
            onRefreshStatus={refreshAllData}
            onOpenDemoModal={() => setIsDemoModalOpen(true)}
          />
        )}
      </main>

      {/* Decision Record Modal */}
      <DecisionRecordModal
        proposal={activeProposalForModal}
        isOpen={isDecisionModalOpen}
        onClose={() => {
          setIsDecisionModalOpen(false);
          setActiveProposalForModal(null);
        }}
        onSuccess={refreshAllData}
      />

      {/* Outcome Feedback Loop Modal */}
      <OutcomeModal
        proposal={activeProposalForModal}
        isOpen={isOutcomeModalOpen}
        onClose={() => {
          setIsOutcomeModalOpen(false);
          setActiveProposalForModal(null);
        }}
        onSuccess={refreshAllData}
      />

      {/* Demo Controls Modal */}
      <DemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        onRefresh={refreshAllData}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12 py-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <strong className="text-gray-900 font-semibold">DECISION GATE</strong>
            <span>— Organizational Precedent Engine</span>
          </div>
          <div>
            Powered by <strong>Hindsight</strong> (Persistent Memory) & <strong>Google Gemini</strong> (Reasoning)
          </div>
        </div>
      </footer>
    </div>
  );
}
