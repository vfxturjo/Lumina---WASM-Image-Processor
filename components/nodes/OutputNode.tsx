import React, { useEffect, useState, useMemo } from 'react';
import { NodeProps, NodeResizer } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { Eye, Download, Layers, ChevronLeft, ChevronRight, Maximize } from 'lucide-react';

const OutputNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { getNodeOutput } = useExecution();
  const { id, data, selected } = props;
  const [output, setOutput] = useState<any>(undefined);
  const [batchIndex, setBatchIndex] = useState(0);

  // Fetch result from execution context
  useEffect(() => {
    const res = getNodeOutput(id);
    
    if (res && typeof res === 'object') {
        if (res.batch && Array.isArray(res.batch) && res.batch.length > 0) {
            setOutput(res.batch); 
        } else if (res.image) {
            setOutput(res.image);
        } else if (res.value !== undefined) {
            setOutput(res.value);
        } else if (res.result !== undefined) {
            setOutput(res.result);
        } else if (Object.keys(res).length > 0) {
            setOutput(res); 
        } else {
            setOutput(undefined);
        }
    } else {
        setOutput(res);
    }
  }, [getNodeOutput, id, data.isProcessing, data.isDirty]);

  const isBatch = Array.isArray(output);
  const batchLength = isBatch ? output.length : 0;

  // Reset index if batch length changes significantly or is gone
  useEffect(() => {
      if (!isBatch) setBatchIndex(0);
      else if (batchIndex >= batchLength) setBatchIndex(0);
  }, [isBatch, batchLength]);

  // Determine what to display based on index
  const currentItem = useMemo(() => {
      if (!output) return null;
      if (isBatch) {
          // Safety check for index
          const idx = Math.min(batchIndex, batchLength - 1);
          return output[idx >= 0 ? idx : 0];
      }
      return output;
  }, [output, isBatch, batchIndex, batchLength]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!output) return;
    
    const link = document.createElement('a');
    
    // If viewing a specific item in a batch, allow downloading just that item
    // Or allow downloading the whole batch JSON
    const itemToDownload = currentItem?.image || currentItem;
    
    if (typeof itemToDownload === 'string' && itemToDownload.startsWith('data:image')) {
        link.href = itemToDownload;
        link.download = `result_${isBatch ? batchIndex : ''}.png`;
    } else {
        const blob = new Blob([JSON.stringify(output, null, 2)], {type : 'application/json'});
        link.href = URL.createObjectURL(blob);
        link.download = 'result.json';
    }
    link.click();
  };

  const cycleBatch = (direction: 'prev' | 'next') => {
      if (!isBatch || batchLength === 0) return;
      setBatchIndex(prev => {
          if (direction === 'next') return (prev + 1) % batchLength;
          return (prev - 1 + batchLength) % batchLength;
      });
  };

  // Visual Helpers
  const isImage = typeof currentItem === 'string' && currentItem.startsWith('data:image');
  const isObject = typeof currentItem === 'object' && currentItem !== null;
  const displayImage = isImage ? currentItem : (isObject && currentItem.image ? currentItem.image : null);

  return (
    <>
      <NodeResizer 
        isVisible={selected} 
        minWidth={200} 
        minHeight={200} 
        color="#10b981" 
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />
      
      <BaseNode 
          {...props} 
          title="Viewer" 
          icon={<Eye size={14}/>} 
          inputs={[{ id: 'input', label: 'Input', type: 'any' }]}
          color="border-emerald-800"
          className="h-full w-full min-w-0 min-h-0"
      >
        <div className="flex flex-col gap-2 h-full w-full">
          
          {/* Display Area - Flex grow to fill resized space */}
          <div className={`
              relative w-full flex-1 overflow-hidden rounded bg-slate-950 border border-slate-800 flex items-center justify-center group min-h-0
              ${displayImage ? 'pattern-grid' : 'p-2'}
          `}>
             {!output ? (
               <div className="text-xs text-slate-600 flex flex-col items-center gap-1">
                  <span>Waiting...</span>
               </div>
             ) : displayImage ? (
               <img 
                  src={displayImage} 
                  alt="Result" 
                  className="h-full w-full object-contain" 
               />
             ) : (
               <div className="w-full h-full overflow-auto font-mono text-[10px] text-emerald-400 whitespace-pre-wrap">
                  {typeof currentItem === 'object' ? JSON.stringify(currentItem, null, 2) : String(currentItem)}
               </div>
             )}

             {/* Batch Cycling Overlay */}
             {isBatch && (
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 text-white p-1 rounded-full backdrop-blur-sm shadow-xl border border-slate-700">
                    <button 
                        onClick={(e) => { e.stopPropagation(); cycleBatch('prev'); }}
                        className="p-1 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] font-mono min-w-[40px] text-center select-none">
                        {batchIndex + 1} / {batchLength}
                    </span>
                    <button 
                         onClick={(e) => { e.stopPropagation(); cycleBatch('next'); }}
                         className="p-1 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                    >
                        <ChevronRight size={14} />
                    </button>
                 </div>
             )}
             
             {/* Format Badge */}
             <div className="absolute top-2 right-2 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-slate-400 uppercase tracking-wider border border-white/10 pointer-events-none">
                {isBatch ? 'Batch' : (isImage || displayImage ? 'Image' : 'Data')}
             </div>
          </div>

          {/* Footer Controls */}
          {output && (
              <div className="flex gap-2 shrink-0">
                <button 
                    onClick={handleDownload}
                    className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-emerald-900/30 hover:bg-emerald-900/50 text-emerald-200 text-xs rounded border border-emerald-800/50 transition-colors"
                >
                    <Download size={12} /> {isBatch ? 'Save Item' : 'Save'}
                </button>
              </div>
          )}
        </div>
      </BaseNode>
    </>
  );
};

export default OutputNode;