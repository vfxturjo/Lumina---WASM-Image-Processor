
import React, { useState, useEffect } from 'react';
import { useExecution } from '../context/ExecutionContext';
import { AVAILABLE_NODES } from '../constants';
import { Settings2, Plus, Trash2, Play, Upload, X, RotateCcw, Info, Download, ExternalLink, Scan } from 'lucide-react';

interface InspectorProps {
  selectedNodeId: string | null;
}

const Inspector: React.FC<InspectorProps> = ({ selectedNodeId }) => {
  const { nodes, edges, updateNodeParams, updateNodeParamsBatch, updateNodeData, markDirty, getNodeOutput } = useExecution();
  
  // Local state for dynamic inputs
  const [newInputName, setNewInputName] = useState('Item');

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  if (!selectedNode) {
    return (
      <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-900 p-4 hidden lg:block z-10">
        <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
          <Settings2 size={48} className="mb-4 opacity-20" />
          <p className="text-sm">Select a node to edit</p>
        </div>
      </aside>
    );
  }

  const { params, label, type } = selectedNode.data;
  const nodeDef = AVAILABLE_NODES.find(n => n.type === type);

  // --- Handlers ---
  const addDynamicInput = () => {
    const current = selectedNode.data.dynamicInputs || [];
    const newId = `item_${Date.now()}`;
    updateNodeData(selectedNodeId!, { dynamicInputs: [...current, { id: newId, label: newInputName }] });
    setNewInputName('Item');
  };

  const removeDynamicInput = (id: string) => {
    const current = selectedNode.data.dynamicInputs || [];
    updateNodeData(selectedNodeId!, { dynamicInputs: current.filter(i => i.id !== id) });
  };

  const updateCode = (code: string) => updateNodeData(selectedNodeId!, { code });

  // CSV Handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (!file) return;
     const reader = new FileReader();
     reader.onload = (evt) => {
         const text = evt.target?.result as string;
         const lines = text.split('\n').map(l => l.trim()).filter(l => l);
         const data = lines.map(l => l.split(','));
         updateNodeParams(selectedNodeId!, 'data', data);
     };
     reader.readAsText(file);
  };

  // Helper to get valid image source from input edge (handles single or batch)
  const getInputImageSrc = () => {
      const incomingEdge = edges.find(e => e.target === selectedNodeId && (e.targetHandle === 'image' || e.targetHandle === 'input'));
      if (!incomingEdge) return null;

      const sourceResult = getNodeOutput(incomingEdge.source);
      let imageSrc = sourceResult?.image || sourceResult?.value; 
      
      // If batch, take first item for preview/calculation
      if (Array.isArray(imageSrc) && imageSrc.length > 0) {
          imageSrc = imageSrc[0].image || imageSrc[0];
      } else if (sourceResult?.batch && Array.isArray(sourceResult.batch) && sourceResult.batch.length > 0) {
          imageSrc = sourceResult.batch[0].image || sourceResult.batch[0];
      }

      return typeof imageSrc === 'string' && imageSrc.startsWith('data:image') ? imageSrc : null;
  };

  // Crop Reset Handler
  const handleCropReset = () => {
      const imageSrc = getInputImageSrc();

      if (imageSrc) {
          const img = new Image();
          img.onload = () => {
              updateNodeParamsBatch(selectedNodeId!, {
                  x: 0,
                  y: 0,
                  width: img.width,
                  height: img.height
              });
          };
          img.src = imageSrc;
      }
  };

  // Crop to Opaque Handler
  const handleCropToOpaque = () => {
      const imageSrc = getInputImageSrc();

      if (imageSrc) {
          const img = new Image();
          img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return;
              
              ctx.drawImage(img, 0, 0);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const data = imageData.data;
              
              let minX = canvas.width;
              let minY = canvas.height;
              let maxX = 0;
              let maxY = 0;
              let found = false;

              for (let y = 0; y < canvas.height; y++) {
                  for (let x = 0; x < canvas.width; x++) {
                      const alpha = data[(y * canvas.width + x) * 4 + 3];
                      if (alpha > 0) {
                          if (x < minX) minX = x;
                          if (x > maxX) maxX = x;
                          if (y < minY) minY = y;
                          if (y > maxY) maxY = y;
                          found = true;
                      }
                  }
              }

              if (found) {
                  updateNodeParamsBatch(selectedNodeId!, {
                      x: minX,
                      y: minY,
                      width: maxX - minX + 1,
                      height: maxY - minY + 1
                  });
              }
          };
          img.src = imageSrc;
      }
  };

  const isConvertBatch = type === 'batchConvert';

  return (
    <aside className="w-80 shrink-0 flex flex-col border-l border-slate-800 bg-slate-900 hidden lg:flex z-10 h-full overflow-hidden">
      <div className="border-b border-slate-800 p-4 shrink-0">
        <h2 className="text-sm font-bold text-slate-200">{label}</h2>
        <span className="text-xs text-slate-500 font-mono">Type: {type}</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* 1. Configured Parameter Controls */}
        {nodeDef?.paramConfig?.map(conf => (
            <div key={conf.key} className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-400">{conf.label}</label>
                    {conf.type !== 'color' && conf.type !== 'text' && <span className="text-xs font-mono text-indigo-400">{params[conf.key]}</span>}
                </div>
                
                {(conf.type === 'int' || conf.type === 'float') && (
                    <input 
                        type="range" 
                        min={conf.min} 
                        max={conf.max} 
                        step={conf.step}
                        value={params[conf.key] ?? nodeDef.defaultParams[conf.key]} 
                        onChange={(e) => updateNodeParams(selectedNodeId!, conf.key, parseFloat(e.target.value))}
                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                )}
                
                {(conf.type === 'text') && (
                    <input
                        type="text"
                        value={params[conf.key] || ''}
                        onChange={(e) => updateNodeParams(selectedNodeId!, conf.key, e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                    />
                )}

                {(conf.type === 'color') && (
                    <div className="flex gap-2 items-center">
                        <input
                            type="color"
                            value={params[conf.key] || '#ffffff'}
                            onChange={(e) => updateNodeParams(selectedNodeId!, conf.key, e.target.value)}
                            className="h-8 w-full bg-slate-800 border border-slate-700 rounded cursor-pointer"
                        />
                    </div>
                )}

                {(conf.type === 'select') && (
                    <select 
                        className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                        value={params[conf.key]}
                        onChange={(e) => updateNodeParams(selectedNodeId!, conf.key, e.target.value)}
                    >
                        {conf.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                )}

                {(conf.type === 'boolean') && (
                    <div className="flex items-center gap-2">
                         <input 
                            type="checkbox" 
                            checked={params[conf.key] ?? nodeDef.defaultParams[conf.key]}
                            onChange={(e) => updateNodeParams(selectedNodeId!, conf.key, e.target.checked)}
                         />
                         <span className="text-xs text-slate-500">{params[conf.key] ? 'On' : 'Off'}</span>
                    </div>
                )}
            </div>
        ))}

        {/* Crop Actions */}
        {type === 'crop' && (
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <button 
                    onClick={handleCropReset}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs py-2 rounded transition-colors"
                    title="Reset crop to full image size"
                >
                    <RotateCcw size={12} /> Crop to Input Canvas
                </button>
                <button 
                    onClick={handleCropToOpaque}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-800 text-indigo-200 text-xs py-2 rounded transition-colors"
                    title="Auto-crop to remove transparent pixels"
                >
                    <Scan size={12} /> Crop to Opaque Pixels
                </button>
            </div>
        )}

        {/* 2. Dynamic Inputs Editor (Math & Batch Convert) */}
        {(type === 'math' || isConvertBatch) && (
             <div className="space-y-4">
                <div className="bg-slate-800/50 rounded p-3 border border-slate-800">
                    <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                        {isConvertBatch ? 'Batch Items' : 'Inputs'}
                    </h3>
                    <div className="space-y-2 mb-3">
                        {selectedNode.data.dynamicInputs?.map(input => (
                            <div key={input.id} className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
                                <span className="text-xs font-mono text-indigo-400">{input.label}</span>
                                <button onClick={() => removeDynamicInput(input.id)} className="text-slate-600 hover:text-red-400">
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                        {(!selectedNode.data.dynamicInputs || selectedNode.data.dynamicInputs.length === 0) && (
                             <div className="text-[10px] text-slate-600 italic text-center">No inputs</div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 text-xs text-slate-200"
                            placeholder="Label"
                            value={newInputName}
                            onChange={e => setNewInputName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addDynamicInput()}
                        />
                        <button onClick={addDynamicInput} className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded">
                            <Plus size={14} />
                        </button>
                    </div>
                </div>
             </div>
        )}

        {/* 3. Math Code Editor */}
        {type === 'math' && (
            <div className="flex flex-col gap-1 h-64">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">JavaScript</label>
                <textarea
                    className="flex-1 bg-slate-950 border border-slate-800 rounded p-2 font-mono text-xs text-slate-300 resize-none focus:border-orange-500 outline-none"
                    value={selectedNode.data.code || ''}
                    onChange={e => updateCode(e.target.value)}
                    spellCheck={false}
                />
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">Returns result</span>
                    <button onClick={() => markDirty(selectedNodeId!)} className="flex items-center gap-1 text-xs bg-orange-600 hover:bg-orange-500 text-white px-3 py-1 rounded">
                        <Play size={10} /> Run
                    </button>
                </div>
                {selectedNode.data.error && (
                     <div className="p-2 bg-red-900/20 border border-red-800 rounded text-xs text-red-300 break-words">
                        Error: {selectedNode.data.error}
                     </div>
                )}
            </div>
        )}

        {/* 4. CSV Uploader */}
        {type === 'textSource' && (
             <div className="space-y-2">
                 <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer hover:bg-slate-800 transition-colors">
                    <Upload size={20} className="text-slate-400 mb-1" />
                    <span className="text-xs text-slate-500">Upload .CSV</span>
                    <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                 </label>
                 <div className="text-[10px] text-slate-500 text-center">
                     Loaded Rows: {params.data?.length || 0}
                 </div>
             </div>
        )}

        {/* 5. Table Editor - Link to Node */}
        {(type === 'table' || type === 'textSource') && (
             <div className="p-4 bg-slate-800/50 rounded border border-slate-800 text-center">
                 <p className="text-xs text-slate-400 mb-2">To edit the table structure and content, please use the <strong>Edit</strong> button located directly on the node in the canvas.</p>
                 <div className="inline-flex items-center justify-center gap-2 text-[10px] text-indigo-400 bg-indigo-900/20 px-2 py-1 rounded border border-indigo-900/50">
                    <ExternalLink size={10} /> Node Editor Available
                 </div>
             </div>
        )}
    
      </div>
    </aside>
  );
};

export default Inspector;