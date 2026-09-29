import React, { useState } from 'react';
import { 
  Lightbulb, 
  Search, 
  Filter, 
  PlusCircle, 
  FileSearch, 
  BookmarkCheck, 
  BrainCircuit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Proposal } from '../types.ts';

interface ProposalsListViewProps {
  proposals: Proposal[];
  onNavigate: (tab: string, entityId?: string) => void;
  onOpenOutcomeModal: (proposal: Proposal) => void;
}

export const ProposalsListView: React.FC<ProposalsListViewProps> = ({
  proposals,
  onNavigate,
  onOpenOutcomeModal,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = proposals.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const textCorpus = `${p.title} ${p.submittedBy} ${p.problemBeingSolved} ${p.proposedSolution} ${p.technologyApproach}`.toLowerCase();
    const matchesSearch = textCorpus.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl font-bold text-gray-900">Proposals Under Precedent Evaluation</h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Proposals reviewed through Decision Gate before budget allocation and engineering execution.
          </p>
        </div>
        <button
          onClick={() => onNavigate('new-proposal')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Submit Proposal
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search proposals, problems, solutions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses ({proposals.length})</option>
            <option value="DRAFT">Draft</option>
            <option value="ANALYZED">Analyzed</option>
            <option value="DECIDED">Decided</option>
            <option value="COMPLETED">Completed (Outcome Logged)</option>
          </select>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl p-12 text-center">
          <Lightbulb className="w-10 h-10 mx-auto text-gray-400 mb-3" />
          <h3 className="text-base font-semibold text-gray-900">
            {proposals.length === 0 ? 'No proposals registered yet.' : 'No matching proposals found.'}
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {proposals.length === 0
              ? 'Submit a proposal to evaluate it against past organizational experience and generate a Precedent Report.'
              : 'Try clearing your search query or changing the filter.'}
          </p>
          {proposals.length === 0 && (
            <button
              onClick={() => onNavigate('new-proposal')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Submit First Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((prop) => {
            const hasDecision = Boolean(prop.decisionRecord);
            const hasOutcome = Boolean(prop.outcome);

            return (
              <div
                key={prop.id}
                className="bg-white border border-gray-200 hover:border-indigo-300 rounded-xl p-5 shadow-xs transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 
                        onClick={() => onNavigate('proposal-analysis', prop.id)}
                        className="text-base font-bold text-gray-900 hover:text-indigo-600 cursor-pointer"
                      >
                        {prop.title}
                      </h2>

                      {/* Status Badge */}
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                        prop.status === 'COMPLETED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : prop.status === 'DECIDED'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : prop.status === 'ANALYZED'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200'
                      }`}>
                        {prop.status}
                      </span>

                      {/* Human Decision Badge */}
                      {prop.decisionRecord && (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                          prop.decisionRecord.decision === 'Approved'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : prop.decisionRecord.decision === 'Rejected'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {prop.decisionRecord.decision} by {prop.decisionRecord.decisionMaker}
                        </span>
                      )}

                      {/* Real Outcome Badge */}
                      {prop.outcome && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
                          <BrainCircuit className="w-3 h-3 text-blue-700" />
                          Outcome: {prop.outcome.actualResult}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong className="text-gray-900">Problem:</strong> {prop.problemBeingSolved}
                    </p>

                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong className="text-gray-900">Proposed Solution:</strong> {prop.proposedSolution}
                    </p>

                    {prop.whatIsDifferentFromPrevious && (
                      <p className="text-xs text-blue-800 bg-blue-50/70 p-2 rounded border border-blue-100">
                        <strong className="font-semibold text-blue-900">Differentiation:</strong> {prop.whatIsDifferentFromPrevious}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                      <span>Submitted by <strong>{prop.submittedBy}</strong></span>
                      <span>Date: {prop.createdAt.slice(0, 10)}</span>
                      {prop.department && <span>Dept: {prop.department.name}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <button
                      onClick={() => onNavigate('proposal-analysis', prop.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      {prop.status === 'DRAFT' ? 'Run Precedent Analysis' : 'View Precedent Report'}
                    </button>

                    {/* Outcome feedback loop button: only available once decided */}
                    {hasDecision && !hasOutcome && (
                      <button
                        onClick={() => onOpenOutcomeModal(prop)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <BrainCircuit className="w-3.5 h-3.5 text-emerald-700" />
                        Log Real Outcome
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
