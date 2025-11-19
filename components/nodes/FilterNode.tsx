import React, { useMemo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import { AVAILABLE_NODES } from '../../constants';
import BaseNode from './BaseNode';
import { Sliders, Link, RotateCcw, Scan } from 'lucide-react';

const FilterNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams, updateNodeParamsBatch, edges, getNodeOutput } = useExecution();
  const { data, id } = props;
  
  const nodeDef = useMemo(() => AVAILABLE_NODES.find(n => n.type === data.type), [data.type]);
  const paramConfig = nodeDef?.paramConfig || [];
  
  // Combine static inputs with dynamic inputs
  const dynamicInputs = data.dynamicInputs || [];
  const staticInputs = nodeDef?.inputs || [];
  
  const inputs = useMemo(() => {
    const dynamic = dynamicInputs.map(di => ({ id: di.id, label: di.label, type: 'any' }));
    return [...staticInputs, ...dynamic];
  }, [staticInputs, dynamicInputs]);

  const outputs = nodeDef?.outputs || [];

  // Only show params that are in the config (hides internal params like 'operation')
  const visibleParamKeys = paramConfig.map(c => c.key);
  const hasConfig = paramConfig.length > 0;

  // --- Crop Logic Helpers ---
  const getInputImageSrc = () => {
      const incomingEdge = edges.find(e => e.target === id && (e.targetHandle === 'image' || e.targetHandle === 'input'));
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

  const handleCropReset = () => {
      const imageSrc = getInputImageSrc();
      if (imageSrc) {
          const img = new Image();
          img.onload = () => {
              updateNodeParamsBatch(id, {
                  x: 0,
                  y: 0,
                  width: img.width,
                  height: img.height
              });
          };
          img.src = imageSrc;
      }
  };

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
              const pixels = imageData.data;
              
              let minX = canvas.width;
              let minY = canvas.height;
              let maxX = 0;
              let maxY = 0;
              let found = false;

              for (let y = 0; y < canvas.height; y++) {
                  for (let x = 0; x < canvas.width; x++) {
                      const alpha = pixels[(y * canvas.width + x) * 4 + 3];
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
                  updateNodeParamsBatch(id, {
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


  return (
    <BaseNode 
        {...props} 
        title={data.label} 
        icon={<Sliders size={14}/>} 
        inputs={inputs}
        outputs={outputs}
    >
       <div className="flex flex-col gap-3 min-w-[180px]">
          
          {/* Render configured inputs */}
          {hasConfig && paramConfig.map(conf => {
             const incomingEdge = edges.find(e => e.target === id && e.targetHandle === conf.key);
             const isConnected = !!incomingEdge;
             
             let incomingValue = undefined;
             if (isConnected) {
                 const sourceResult = getNodeOutput(incomingEdge.source);
                 // Extract value from source result object
                 if (sourceResult) {
                    incomingValue = incomingEdge.sourceHandle 
                        ? sourceResult[incomingEdge.sourceHandle] 
                        : (sourceResult['value'] ?? sourceResult);
                 }
             }

             return (
               <div key={conf.key} className="relative space-y-1 group">
                  {/* Parameter Input Handle (Only for numbers) */}
                  {(conf.type === 'int' || conf.type === 'float') && (
                    <Handle
                      type="target"
                      position={Position.Left}
                      id={conf.key}
                      className={`!w-2.5 !h-2.5 !border-2 !border-slate-900 !-left-[19px] top-[60%] transition-colors ${isConnected ? '!bg-indigo-400' : '!bg-cyan-500'}`}
                      title={`Input for ${conf.label}`}
                    />
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                     <label htmlFor={`${id}-${conf.key}`} className="cursor-help" title="Connect a number node here or use slider">{conf.label}</label>
                     
                     {/* Direct Value Input (shown when not connected) */}
                     {!isConnected && (conf.type === 'int' || conf.type === 'float') && (
                         <input 
                            type="number"
                            className="nodrag w-16 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 text-right text-indigo-400 text-[10px] outline-none focus:border-indigo-500 focus:text-indigo-300"
                            value={data.params[conf.key] ?? nodeDef?.defaultParams[conf.key]}
                            onChange={(e) => updateNodeParams(id, conf.key, parseFloat(e.target.value))}
                            step={conf.step}
                         />
                     )}
                  </div>

                  {/* Render Control based on type */}
                  {isConnected ? (
                      <div className="flex items-center gap-2 w-full h-6 bg-slate-800/50 border border-slate-700/50 rounded px-2 text-xs">
                          <Link size={10} className="text-indigo-400 shrink-0" />
                          <span className="font-mono text-slate-300 truncate">
                              {incomingValue !== undefined && incomingValue !== null ? 
                                (typeof incomingValue === 'number' ? incomingValue.toFixed(2) : 'Connected') 
                                : '...'}
                          </span>
                      </div>
                  ) : (
                      <>
                        {(conf.type === 'int' || conf.type === 'float') && (
                          <input 
                            id={`${id}-${conf.key}`}
                            type="range" 
                            className="nodrag w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
                            min={conf.min} 
                            max={conf.max} 
                            step={conf.step}
                            value={data.params[conf.key] ?? nodeDef?.defaultParams[conf.key]}
                            onChange={(e) => updateNodeParams(id, conf.key, parseFloat(e.target.value))}
                          />
                        )}

                        {conf.type === 'text' && (
                           <input
                              id={`${id}-${conf.key}`}
                              type="text"
                              className="nodrag w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                              value={data.params[conf.key] || ''}
                              onChange={(e) => updateNodeParams(id, conf.key, e.target.value)}
                           />
                        )}

                        {conf.type === 'color' && (
                           <div className="flex gap-2 items-center">
                               <input
                                  id={`${id}-${conf.key}`}
                                  type="color"
                                  className="nodrag w-8 h-6 bg-slate-950 border border-slate-700 rounded cursor-pointer"
                                  value={data.params[conf.key] || '#ffffff'}
                                  onChange={(e) => updateNodeParams(id, conf.key, e.target.value)}
                               />
                               <span className="text-[10px] font-mono text-slate-400">{data.params[conf.key] || '#ffffff'}</span>
                           </div>
                        )}

                        {conf.type === 'select' && conf.options && (
                           <select
                              id={`${id}-${conf.key}`}
                              className="nodrag w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                              value={data.params[conf.key] ?? nodeDef?.defaultParams[conf.key]}
                              onChange={(e) => updateNodeParams(id, conf.key, e.target.value)}
                           >
                               {conf.options.map(opt => (
                                   <option key={opt} value={opt}>{opt}</option>
                               ))}
                           </select>
                        )}

                        {conf.type === 'boolean' && (
                            <div className="flex items-center gap-2 mt-1">
                                 <input 
                                    id={`${id}-${conf.key}`}
                                    type="checkbox" 
                                    className="nodrag w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-500 focus:ring-0"
                                    checked={data.params[conf.key] ?? nodeDef?.defaultParams[conf.key]}
                                    onChange={(e) => updateNodeParams(id, conf.key, e.target.checked)}
                                 />
                                 <span className="text-[10px] text-slate-500">{data.params[conf.key] ? 'True' : 'False'}</span>
                            </div>
                        )}
                      </>
                  )}
               </div>
             );
          })}

          {/* CROP ACTIONS (Visible on Node) */}
          {data.type === 'crop' && (
              <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-slate-800/50">
                  <button 
                    onClick={handleCropReset}
                    className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] py-1 rounded transition-colors"
                    title="Reset crop to full image size"
                  >
                    <RotateCcw size={10} /> Full Canvas
                  </button>
                  <button 
                    onClick={handleCropToOpaque}
                    className="flex items-center justify-center gap-1.5 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-800/50 text-indigo-200 text-[10px] py-1 rounded transition-colors"
                    title="Auto-crop to remove transparent pixels"
                  >
                    <Scan size={10} /> Auto Crop
                  </button>
              </div>
          )}

          {/* Fallback for nodes without paramConfig but with params (only show if NOT in config to allow hidden params) */}
          {!hasConfig && Object.keys(data.params).length > 0 && Object.keys(data.params).map(key => {
              // Hide fileData and internal ops
              if (key === 'fileData' || key === 'operation') return null;
              return (
                 <div key={key} className="flex justify-between text-xs text-slate-400">
                   <span className="capitalize">{key}:</span>
                   <span className="font-mono text-slate-200 truncate max-w-[80px]">{JSON.stringify(data.params[key])}</span>
                 </div>
              );
          })}

          {(!hasConfig && Object.keys(data.params).filter(k => k !== 'fileData' && k !== 'operation').length === 0 && data.type !== 'crop') && (
             <div className="text-[10px] text-slate-600 italic text-center py-1">
                No editable settings
             </div>
          )}
       </div>
    </BaseNode>
  );
};

export default FilterNode;