import React from 'react';
import { 
  ShieldAlert, 
  Database, 
  BrainCircuit, 
  Sparkles, 
  FileText, 
  History, 
  Lightbulb, 
  BarChart3, 
  Settings as SettingsIcon,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { SystemStatus } from '../types.ts';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  status: SystemStatus | null;
  onRefreshStatus: () => void;
  onOpenDemoModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  status,
  onOpenDemoModal,
}) => {
  const isHindsightAvailable = status?.hindsight?.isAvailable;
  const isPostgresConnected = status?.database?.postgresConnected;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: ShieldAlert },
    { id: 'proposals', label: 'Proposals', icon: Lightbulb },
    { id: 'new-proposal', label: 'Submit Proposal', icon: PlusCircle },
    { id: 'historical-projects', label: 'Past Initiatives', icon: History },
    { id: 'add-experience', label: 'Capture Experience', icon: PlusCircle },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'insights', label: 'Knowledge Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings & Audit', icon: SettingsIcon },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner with System Status and Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-gray-100">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              DG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-lg tracking-tight">DECISION GATE</span>
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-blue-50 text-blue-700 border border-blue-200">
                  Precedent Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 font-normal">
                Learn from what the organization already tried before saying YES.
              </p>
            </div>
          </div>

          {/* System Connectivity Indicators */}
          <div className="hidden md:flex items-center gap-3">
            {/* Hindsight Status */}
            <div 
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border ${
                isHindsightAvailable 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isHindsightAvailable ? 'Hindsight Memory: Connected' : 'Hindsight: Key not set in .env (Check Settings)'}
            >
              <BrainCircuit className="w-3.5 h-3.5" />
              <span className="font-medium">Hindsight:</span>
              <span>{isHindsightAvailable ? 'Connected' : 'Unavailable'}</span>
            </div>

            {/* PostgreSQL / Storage Status */}
            <div 
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-slate-50 text-slate-700 border-slate-200"
              title={`Storage: ${status?.database?.storageMode || 'Relational'}`}
            >
              <Database className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium">Database:</span>
              <span>{isPostgresConnected ? 'PostgreSQL' : 'Relational (Active)'}</span>
            </div>

            {/* Gemini AI Status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs border bg-indigo-50 text-indigo-700 border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium">Gemini 3.8 Flash</span>
            </div>

            {/* Demo Controls */}
            <button
              onClick={onOpenDemoModal}
              className="ml-2 text-xs px-2.5 py-1 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium transition-colors cursor-pointer"
            >
              Demo Controls
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
