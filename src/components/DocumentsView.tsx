import React, { useState } from 'react';
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Eye,
  Plus
} from 'lucide-react';
import { api } from '../api.ts';
import { SourceDocument } from '../types.ts';

interface DocumentsViewProps {
  documents: SourceDocument[];
  onNavigate: (tab: string, entityId?: string) => void;
  onRefresh: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onNavigate,
  onRefresh,
}) => {
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Postmortem');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active extracted preview modal/panel
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [activeExtracted, setActiveExtracted] = useState<any | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<SourceDocument | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim() || !content.trim()) {
      setUploadError('Document title and text content are required.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      setActionError(null);
      await api.uploadDocument(docName, docType, content);
      setDocName('');
      setContent('');
      onRefresh();
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleExtract = async (doc: SourceDocument) => {
    try {
      setExtractingId(doc.id);
      setSelectedDoc(doc);
      setActionError(null);
      const res = await api.extractDocument(doc.id);
      setActiveExtracted(res.extracted);
    } catch (err: any) {
      setActionError(`Extraction failed: ${err.message}`);
    } finally {
      setExtractingId(null);
    }
  };

  const handleApproveIntoMemory = async () => {
    if (!activeExtracted || !selectedDoc) return;
    try {
      setActionError(null);
      const projectPayload = {
        name: activeExtracted.projectName || selectedDoc.name,
        projectType: activeExtracted.projectType || 'General',
        startDate: activeExtracted.startDate || undefined,
        endDate: activeExtracted.endDate || undefined,
        status: activeExtracted.status || 'Unknown',
        problemGoal: activeExtracted.problemGoal || 'Extracted goal',
      };

      const experiencePayload = {
        problemGoal: activeExtracted.problemGoal || 'Extracted goal',
        whatWasAttempted: activeExtracted.whatWasAttempted || 'Attempted initiative',
        approachUsed: activeExtracted.approachUsed || 'Standard approach',
        whatHappened: activeExtracted.whatHappened || 'Unfolded according to report',
        whatWorked: activeExtracted.whatWorked,
        whatFailed: activeExtracted.whatFailed,
        whyItFailed: activeExtracted.whyItFailed,
        rootCause: activeExtracted.rootCause,
        lessonsLearned: activeExtracted.lessonsLearned || 'Documented retrospective findings',
        futureConditions: activeExtracted.futureConditions,
        source: `${selectedDoc.name} (${selectedDoc.documentType})`,
      };

      await api.createHistoricalProject(projectPayload, experiencePayload, false);
      setActiveExtracted(null);
      setSelectedDoc(null);
      onRefresh();
      onNavigate('historical-projects');
    } catch (err: any) {
      setActionError(`Approval error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900">Document Ingestion & Source Repository</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Upload historical project postmortems, retrospective memos, and decision documents.
          Gemini extracts organizational experiences, which you review before retaining into Hindsight memory.
        </p>

        {actionError && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="font-bold text-rose-600 hover:text-rose-800 ml-2 cursor-pointer">
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Upload Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Upload className="w-4 h-4 text-blue-600" />
          <span>Upload or Ingest Document</span>
        </h2>

        <form onSubmit={handleUpload} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Document Title *</label>
              <input
                type="text"
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. Q2 2024 Customer Assistant Postmortem"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Document Type</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Postmortem">Postmortem</option>
                <option value="Project Report">Project Report</option>
                <option value="Retrospective">Retrospective</option>
                <option value="Meeting Notes">Meeting Notes</option>
                <option value="Decision Document">Decision Document</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-gray-700 mb-1">Document Text Content *</label>
            <textarea
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste raw postmortem or incident write-up..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </div>

          {uploadError && (
            <div className="p-2.5 rounded bg-rose-50 text-rose-800 border border-rose-200 text-xs">
              {uploadError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
          </div>
        </form>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-900 pb-2 border-b border-gray-100">
          Source Documents Repository ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <p className="text-xs text-gray-500 py-6 text-center">No source documents uploaded yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div key={doc.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-900 text-sm">{doc.name}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {doc.documentType}
                    </span>
                    <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${
                      doc.processingStatus === 'APPROVED'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : doc.processingStatus === 'EXTRACTED'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}>
                      {doc.processingStatus}
                    </span>
                  </div>
                  <p className="text-gray-500 line-clamp-1 pl-6">
                    {doc.content.slice(0, 100)}...
                  </p>
                </div>

                <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                  <button
                    onClick={() => handleExtract(doc)}
                    disabled={extractingId === doc.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    {extractingId === doc.id ? 'Extracting...' : 'Extract Experience'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal for Extracted Document Experience */}
      {activeExtracted && selectedDoc && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 sm:p-8 shadow-xl border border-gray-200 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Review AI-Extracted Organizational Experience</h3>
              </div>
              <button onClick={() => setActiveExtracted(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              From document: <strong>{selectedDoc.name}</strong>. The user must review and approve this extracted experience before it becomes persistent organizational memory in Hindsight.
            </p>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2 max-h-96 overflow-y-auto">
              <div><strong>Project Name:</strong> {activeExtracted.projectName}</div>
              <div><strong>Goal:</strong> {activeExtracted.problemGoal}</div>
              <div><strong>Attempted:</strong> {activeExtracted.whatWasAttempted}</div>
              <div><strong>Outcome:</strong> {activeExtracted.status}</div>
              <div><strong>What Happened:</strong> {activeExtracted.whatHappened}</div>
              {activeExtracted.whatFailed && <div><strong>What Failed:</strong> {activeExtracted.whatFailed}</div>}
              {activeExtracted.rootCause && <div><strong>Root Cause:</strong> {activeExtracted.rootCause}</div>}
              <div className="pt-1 text-blue-900 font-semibold">
                <strong>Lessons Learned:</strong> {activeExtracted.lessonsLearned}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => setActiveExtracted(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveIntoMemory}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer"
              >
                <BrainCircuit className="w-4 h-4" />
                Approve & Retain in Memory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
