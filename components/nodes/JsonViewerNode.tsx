import React, { useMemo } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { FileJson } from 'lucide-react';

const JsonViewerNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { getNodeOutput } = useExecution();
  const { id } = props;
  
  const result = getNodeOutput(id);
  // For this node, we expect 'data' key, or fallback to the whole result
  const displayData = result?.data ?? result;

  const safeJsonString = useMemo(() => {
      if (displayData === undefined) return '';
      
      try {
        return JSON.stringify(displayData, (key, value) => {
            if (typeof value === 'string' && value.length > 100) {
                // Truncate long strings (images, base64, etc)
                return value.substring(0, 100) + `... [${value.length} chars]`;
            }
            return value;
        }, 2);
      } catch (e) {
          return `[Circular or Invalid JSON]`;
      }
  }, [displayData]);

  return (
    <BaseNode 
        {...props} 
        title="JSON Viewer" 
        icon={<FileJson size={14}/>} 
        inputs={[{ id: 'data', label: 'Data', type: 'any' }]}
        color="border-slate-600"
    >
      <div className="bg-slate-950 border border-slate-800 rounded p-2 min-w-[200px] max-w-[300px] h-[200px] overflow-auto">
          {safeJsonString ? (
             <pre className="text-[9px] text-green-400 font-mono whitespace-pre-wrap break-all">
                 {safeJsonString}
             </pre>
          ) : (
             <div className="text-[10px] text-slate-500 text-center italic mt-4">
                 Waiting for data...
             </div>
          )}
      </div>
    </BaseNode>
  );
};

export default JsonViewerNode;