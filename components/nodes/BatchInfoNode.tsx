import React from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { ArrowLeft, ArrowRight, Layers, FileText } from 'lucide-react';

const BatchInfoNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams, getNodeOutput } = useExecution();
  const { id, data } = props;
  
  const nodeOutput = getNodeOutput(id);
  
  const count = nodeOutput?.count || 0;
  const currentIndex = data.params.index || 0;
  const currentItem = nodeOutput?.meta || nodeOutput?.item;

  // Helper to detect content type
  const previewImage = currentItem?.image || (typeof currentItem === 'string' && currentItem.startsWith('data:image') ? currentItem : null);
  const previewLabel = currentItem?.name || (typeof currentItem === 'object' ? 'Object' : String(currentItem).slice(0, 20));

  const setIndex = (newIndex: number) => {
      let target = newIndex;
      if (target < 0) target = 0;
      if (count > 0 && target >= count) target = count - 1;
      updateNodeParams(id, 'index', target);
  };

  return (
    <BaseNode 
        {...props} 
        title="Batch Inspector" 
        icon={<Layers size={14}/>} 
        inputs={[{ id: 'batch', label: 'Batch', type: 'batch' }]}
        outputs={[
            { id: 'item', label: 'Item', type: 'any' },
            { id: 'count', label: 'Count', type: 'number' },
            { id: 'meta', label: 'Meta', type: 'any' }
        ]}
        color="border-orange-700"
    >
       <div className="flex flex-col gap-3 min-w-[180px]">
           
           {/* Preview Window */}
           <div className="relative w-full h-32 bg-slate-950 rounded border border-slate-800 flex items-center justify-center overflow-hidden group">
               {count === 0 ? (
                   <span className="text-[10px] text-slate-600 italic">No Batch Data</span>
               ) : previewImage ? (
                   <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
               ) : (
                   <div className="flex flex-col items-center gap-2 text-slate-500">
                       <FileText size={24} />
                       <span className="text-[9px] font-mono px-2 text-center break-all">{previewLabel}</span>
                   </div>
               )}
               
               {/* Overlay Info */}
               <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-[9px] text-white flex justify-between px-2">
                   <span>{previewImage ? 'Image' : 'Data'}</span>
                   <span>{count > 0 ? currentIndex + 1 : 0} / {count}</span>
               </div>
           </div>

           {/* Controls */}
           <div className="flex items-center justify-between gap-2 bg-slate-900 p-1 rounded border border-slate-800">
               <button 
                   onClick={() => setIndex(currentIndex - 1)}
                   className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                   disabled={count === 0 || currentIndex <= 0}
               >
                   <ArrowLeft size={14} />
               </button>
               
               <div className="flex flex-col items-center">
                   <span className="text-[10px] font-bold text-slate-300">Index {currentIndex}</span>
                   <span className="text-[8px] text-slate-500">of {count} items</span>
               </div>

               <button 
                   onClick={() => setIndex(currentIndex + 1)}
                   className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30"
                   disabled={count === 0 || currentIndex >= count - 1}
               >
                   <ArrowRight size={14} />
               </button>
           </div>

           {/* Quick Meta View */}
           {currentItem && typeof currentItem === 'object' && (
               <div className="text-[9px] font-mono text-slate-500 border-t border-slate-800 pt-2 mt-1">
                   {Object.keys(currentItem).filter(k => k !== 'image').map(k => (
                       <div key={k} className="flex justify-between">
                           <span className="opacity-70">{k}:</span>
                           <span className="text-slate-300 truncate max-w-[80px]">{String(currentItem[k])}</span>
                       </div>
                   ))}
               </div>
           )}
       </div>
    </BaseNode>
  );
};

export default BatchInfoNode;