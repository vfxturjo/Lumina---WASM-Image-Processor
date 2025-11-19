import React, { useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { Calculator, AlertTriangle, Plus, X } from 'lucide-react';

const MathNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeData } = useExecution();
  const { data, id } = props;
  const dynamicInputs = data.dynamicInputs || [];

  // Map dynamic inputs to the structure BaseNode expects
  const inputs = useMemo(() => 
    dynamicInputs.map(di => ({ id: di.id, label: di.label, type: 'number' })),
  [dynamicInputs]);

  const addInput = () => {
      const newId = `in_${Date.now().toString().slice(-4)}`;
      const newLabel = `x${dynamicInputs.length + 1}`;
      updateNodeData(id, {
          dynamicInputs: [...dynamicInputs, { id: newId, label: newLabel }]
      });
  };

  const removeInput = (inputId: string) => {
      updateNodeData(id, {
          dynamicInputs: dynamicInputs.filter(i => i.id !== inputId)
      });
  };
  
  const updateInputLabel = (inputId: string, newLabel: string) => {
      updateNodeData(id, {
          dynamicInputs: dynamicInputs.map(i => i.id === inputId ? { ...i, label: newLabel } : i)
      });
  };

  return (
    <BaseNode 
      {...props} 
      title={data.label} 
      icon={<Calculator size={14}/>} 
      inputs={inputs}
      outputs={[{ id: 'result', label: 'Result', type: 'any' }]}
      color={data.error ? 'border-red-600' : 'border-orange-600'}
    >
      <div className="flex flex-col gap-2 min-w-[240px]">
        
        {/* Code Editor */}
        <div className="flex flex-col gap-1">
            <label className="text-[10px] font-semibold text-slate-500 uppercase flex justify-between">
              Script (JS)
              <span className="text-[9px] text-slate-600">Return &#123; result: val &#125;</span>
            </label>
            <textarea 
                className="nodrag w-full h-28 bg-slate-950 border border-slate-800 rounded p-2 font-mono text-[10px] text-slate-300 resize-y outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
                value={data.code || ''}
                onChange={(e) => updateNodeData(id, { code: e.target.value })}
                placeholder="return { result: a + b };"
                spellCheck={false}
            />
            {data.error && (
                <div className="flex items-start gap-1 text-[10px] text-red-400 bg-red-900/10 p-1 rounded border border-red-900/30">
                    <AlertTriangle size={10} className="shrink-0 mt-0.5" /> 
                    <span className="break-all leading-tight">{data.error}</span>
                </div>
            )}
        </div>

        {/* Dynamic Inputs Config */}
        <div className="flex flex-col gap-1 border-t border-slate-800 pt-2 mt-1">
            <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Variables</label>
                <button 
                    onClick={addInput}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-[10px]"
                    title="Add Variable"
                >
                    <Plus size={10} /> Add
                </button>
            </div>
            
            <div className="space-y-1">
              {dynamicInputs.map((input) => (
                  <div key={input.id} className="flex items-center gap-2">
                      {/* Note: We don't render handles here anymore, BaseNode does it in the top row. 
                          This section is just for RENAMING variables. */}
                      <div className="flex-1 flex items-center bg-slate-900 rounded border border-slate-800 hover:border-slate-700 transition-colors">
                        <input 
                            className="nodrag w-full bg-transparent border-none text-xs font-mono text-orange-300 outline-none px-2 py-0.5 placeholder-slate-600"
                            value={input.label}
                            placeholder="var_name"
                            onChange={(e) => updateInputLabel(input.id, e.target.value)}
                        />
                        <button 
                            onClick={() => removeInput(input.id)}
                            className="px-1.5 text-slate-600 hover:text-red-400 transition-colors"
                            title="Remove"
                        >
                            <X size={12} />
                        </button>
                      </div>
                  </div>
              ))}
            </div>
            
            {dynamicInputs.length === 0 && (
              <div className="text-[10px] text-slate-600 italic text-center py-1 bg-slate-900/30 rounded border border-dashed border-slate-800">
                No inputs defined
              </div>
            )}
        </div>
      </div>
    </BaseNode>
  );
};

export default MathNode;