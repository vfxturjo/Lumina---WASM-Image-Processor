import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { NodeData, IOSocketDef } from '../../types';
import { Loader2 } from 'lucide-react';

type BaseNodeProps = NodeProps<NodeData> & {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
  inputs?: IOSocketDef[];
  outputs?: IOSocketDef[];
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

const BaseNode: React.FC<BaseNodeProps> = ({ 
  data, 
  selected, 
  children, 
  title, 
  icon, 
  inputs = [], 
  outputs = [],
  color = 'border-slate-600',
  className = '',
  style
}) => {
  return (
    <div 
      style={style}
      className={`
        relative flex flex-col min-w-[200px] rounded-lg border-2 bg-slate-900 shadow-xl transition-shadow
        ${selected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : color}
        ${data.isDirty ? 'border-dashed border-yellow-600' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between rounded-t-md bg-slate-800 px-3 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          {icon && <span className="text-slate-400">{icon}</span>}
          <span className="text-xs font-semibold tracking-wider text-slate-200">
            {title}
          </span>
        </div>
        {data.isProcessing && (
          <Loader2 size={14} className="animate-spin text-indigo-400" />
        )}
        {data.isDirty && !data.isProcessing && (
          <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" title="Needs update" />
        )}
      </div>

      {/* IO Row - Dedicated section for named Inputs/Outputs */}
      {(inputs.length > 0 || outputs.length > 0) && (
        <div className="flex shrink-0 justify-between items-start px-3 py-2 bg-slate-950/50 border-b border-slate-800/50">
            {/* Inputs Column */}
            <div className="flex flex-col gap-2">
                {inputs.map((input) => (
                    <div key={input.id} className="relative flex items-center h-5">
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={input.id}
                            className={`
                                !w-3 !h-3 !border-2 !border-slate-900 
                                !-left-[19px] transition-colors
                                ${input.type === 'image' ? '!bg-indigo-500' : input.type === 'number' ? '!bg-cyan-500' : '!bg-slate-400'}
                                hover:!bg-white
                            `}
                        />
                        <span className="text-[10px] font-mono text-slate-400">
                            {input.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* Outputs Column */}
            <div className="flex flex-col gap-2 items-end">
                {outputs.map((output) => (
                    <div key={output.id} className="relative flex items-center h-5">
                        <span className="text-[10px] font-mono text-slate-400 text-right">
                            {output.label}
                        </span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={output.id}
                            className={`
                                !w-3 !h-3 !border-2 !border-slate-900 
                                !-right-[19px] transition-colors
                                ${output.type === 'image' ? '!bg-indigo-500' : output.type === 'number' ? '!bg-cyan-500' : '!bg-slate-400'}
                                hover:!bg-white
                            `}
                        />
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Body (Parameters / Content) */}
      <div className="p-3 flex-1 flex flex-col min-h-0">
        {children}
      </div>
    </div>
  );
};

export default memo(BaseNode);