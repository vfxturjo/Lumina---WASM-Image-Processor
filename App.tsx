import React, { useState } from 'react';
import { ReactFlowProvider } from 'reactflow';
import { ExecutionProvider, useExecution } from './context/ExecutionContext';
import GraphCanvas from './components/GraphCanvas';
import Sidebar from './components/Sidebar';
import Inspector from './components/Inspector';
import { Layers, Play, Pause, RefreshCw } from 'lucide-react';

// Separate Header to use the Execution Context
const AppHeader: React.FC = () => {
  const { isPaused, togglePause, processGraph } = useExecution();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-indigo-600 text-white">
          <Layers size={20} />
        </div>
        <h1 className="text-sm font-bold tracking-wide text-slate-100">LUMINA <span className="text-xs font-normal text-slate-500 ml-2">CLIENT-SIDE WASM ENGINE</span></h1>
      </div>
      <div className="flex items-center gap-3">
         {isPaused && (
            <button 
              onClick={() => processGraph()}
              className="flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold border border-orange-700 bg-orange-900/30 text-orange-500 hover:bg-orange-900/50 transition-colors"
              title="Process the graph once manually"
            >
               <RefreshCw size={12} />
               RUN ONCE
            </button>
         )}

         <button 
           onClick={togglePause}
           className={`flex items-center gap-2 px-3 py-1 rounded text-xs font-semibold border transition-colors ${isPaused 
             ? 'bg-yellow-900/30 border-yellow-700 text-yellow-500 hover:bg-yellow-900/50' 
             : 'bg-emerald-900/30 border-emerald-700 text-emerald-500 hover:bg-emerald-900/50'}`}
         >
            {isPaused ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
            {isPaused ? 'PAUSED' : 'AUTO-RUN'}
         </button>
         <span className="text-xs text-slate-500 px-2 py-1 rounded bg-slate-800 border border-slate-700">v0.9.1-beta</span>
      </div>
    </header>
  );
};

const App: React.FC = () => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-screen flex-col bg-slate-950 text-slate-200 overflow-hidden">
      <ReactFlowProvider>
        <ExecutionProvider>
          
          <AppHeader />

          {/* Main Workspace */}
          <div className="flex flex-1 overflow-hidden relative">
            {/* Left Panel: Node Palette */}
            <Sidebar />

            {/* Center Panel: Graph Canvas */}
            <div className="flex-1 h-full relative bg-slate-950">
              <GraphCanvas onNodeSelect={setSelectedNodeId} />
            </div>

            {/* Right Panel: Inspector */}
            <Inspector selectedNodeId={selectedNodeId} />
          </div>
          
        </ExecutionProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default App;