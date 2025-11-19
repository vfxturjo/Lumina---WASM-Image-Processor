import React, { useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { Layers, Plus, X } from 'lucide-react';

const BatchConvertNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeData } = useExecution();
  const { data, id } = props;
  const dynamicInputs = data.dynamicInputs || [];

  // Map dynamic inputs to the structure BaseNode expects for handles
  const inputs = useMemo(() => 
    dynamicInputs.map(di => ({ id: di.id, label: di.label, type: 'any' })),
  [dynamicInputs]);

  const addInput = () => {
      const newId = `item_${Date.now()}`;
      const newLabel = `Item ${dynamicInputs.length + 1}`;
      updateNodeData(id, {
          dynamicInputs: [...dynamicInputs, { id: newId, label: newLabel }]
      });
  };

  const removeInput = (inputId: string) => {
      updateNodeData(id, {
          dynamicInputs: dynamicInputs.filter(i => i.id !== inputId)
      });
  };

  return (
    <BaseNode 
      {...props} 
      title="Convert to Batch" 
      icon={<Layers size={14}/>} 
      inputs={inputs}
      outputs={[{ id: 'batch', label: 'Batch', type: 'batch' }]}
      color="border-fuchsia-700"
    >
      <div className="flex flex-col gap-2 min-w-[180px]">
        <div className="text-[10px] text-slate-500 italic text-center px-2 pb-2">
            Combine individual items into a batch
        </div>

        <div className="flex flex-col gap-1">
            {dynamicInputs.map((input) => (
                <div key={input.id} className="flex items-center justify-between bg-slate-950/50 rounded border border-slate-800/50 px-2 py-1">
                    <span className="text-xs font-mono text-slate-300 truncate flex-1">{input.label}</span>
                    <button 
                        onClick={() => removeInput(input.id)}
                        className="text-slate-600 hover:text-red-400 transition-colors ml-2"
                        title="Remove Input"
                    >
                        <X size={12} />
                    </button>
                </div>
            ))}
            
            {dynamicInputs.length === 0 && (
                <div className="p-2 border border-dashed border-slate-800 rounded text-center text-[10px] text-slate-600">
                    No items
                </div>
            )}
        </div>

        <button 
            onClick={addInput}
            className="mt-1 flex items-center justify-center gap-1 w-full py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-xs text-slate-300 transition-colors"
        >
            <Plus size={12} /> Add Input
        </button>
      </div>
    </BaseNode>
  );
};

export default BatchConvertNode;