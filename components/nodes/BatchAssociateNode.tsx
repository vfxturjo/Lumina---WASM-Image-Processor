import React, { useMemo } from 'react';
import { NodeProps, Handle, Position } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData, AppNode } from '../../types';
import BaseNode from './BaseNode';
import { Link2, Table as TableIcon, ArrowRight } from 'lucide-react';

const BatchAssociateNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams, edges, getNodeOutput, setNodes } = useExecution();
  const { data, id, xPos, yPos } = props;

  const batchKey = data.params.batchKey || 'name';
  const tableKey = data.params.tableKey || 'id';

  // Determine what batch inputs are available for the UI logic
  const incomingBatchEdge = edges.find(e => e.target === id && e.targetHandle === 'batch');
  
  const handleGenerateTable = () => {
      if (!incomingBatchEdge) {
          alert('Please connect a batch input first.');
          return;
      }
      const sourceResult = getNodeOutput(incomingBatchEdge.source);
      const batch = sourceResult?.batch || [];
      
      if (!batch.length) {
          alert('The connected batch is empty.');
          return;
      }

      // Generate rows based on the batchKey
      const headers = ['ID', 'Data']; // Default headers
      const rows = batch.map((item: any, i: number) => {
          const idVal = batchKey === 'index' ? String(i) : (item[batchKey] || `item_${i}`);
          return [idVal, '']; // Pre-fill ID, leave Data empty
      });
      
      const tableData = [headers, ...rows];

      // Spawn new Table Node
      const newNodeId = `table_gen_${Date.now()}`;
      const newNode: AppNode = {
          id: newNodeId,
          type: 'table',
          position: { x: xPos - 300, y: yPos + 100 }, // Place to the left/below
          data: {
              label: 'Generated Batch Data',
              type: 'table',
              params: { rows: tableData },
              isDirty: true
          }
      };

      setNodes((nds) => nds.concat(newNode));
  };

  return (
    <BaseNode 
        {...props} 
        title="Batch Associate" 
        icon={<Link2 size={14}/>} 
        inputs={[
            { id: 'batch', label: 'Batch', type: 'batch' },
            { id: 'data', label: 'Table Data', type: 'any' }
        ]}
        outputs={[{ id: 'batch', label: 'Assoc. Batch', type: 'batch' }]}
        color="border-fuchsia-600"
    >
      <div className="flex flex-col gap-3 min-w-[220px]">
         
         {/* Config Controls */}
         <div className="space-y-2">
             <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-semibold text-slate-400 uppercase">Batch ID Property</label>
                 <select 
                    className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-1"
                    value={batchKey}
                    onChange={(e) => updateNodeParams(id, 'batchKey', e.target.value)}
                 >
                     <option value="name">File Name (name)</option>
                     <option value="index">List Index (0, 1...)</option>
                 </select>
             </div>

             <div className="flex flex-col gap-1">
                 <label className="text-[10px] font-semibold text-slate-400 uppercase">Table ID Column</label>
                 <div className="flex items-center gap-2">
                    <input 
                        type="text"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-1 font-mono"
                        value={tableKey}
                        onChange={(e) => updateNodeParams(id, 'tableKey', e.target.value)}
                        placeholder="e.g. ID, Filename"
                    />
                 </div>
                 <p className="text-[9px] text-slate-500">Matches this column in table to the Batch ID</p>
             </div>
         </div>

         {/* Action Button */}
         <div className="pt-2 border-t border-slate-800">
             <button 
                onClick={handleGenerateTable}
                className="w-full flex items-center justify-center gap-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs rounded border border-slate-700 transition-colors"
                title="Create a Table node pre-filled with IDs from the current batch"
             >
                 <TableIcon size={12} /> Generate Table from Batch
             </button>
         </div>

      </div>
    </BaseNode>
  );
};

export default BatchAssociateNode;