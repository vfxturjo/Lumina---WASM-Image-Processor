import React, { useEffect, useRef } from 'react';
import { useExecution } from '../context/ExecutionContext';
import { Copy, ClipboardPaste, RotateCcw } from 'lucide-react';
import { useReactFlow } from 'reactflow';

interface NodeContextMenuProps {
  nodeId: string | null;
  position: { x: number; y: number };
  onClose: () => void;
}

const NodeContextMenu: React.FC<NodeContextMenuProps> = ({ nodeId, position, onClose }) => {
  const { copyNode, pasteNode, resetNode, nodes } = useExecution();
  const { screenToFlowPosition } = useReactFlow();
  const menuRef = useRef<HTMLDivElement>(null);

  const targetNode = nodeId ? nodes.find(n => n.id === nodeId) : null;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Prevent menu from going off-screen
  const adjustedLeft = Math.min(position.x, window.innerWidth - 180);
  const adjustedTop = Math.min(position.y, window.innerHeight - 150);

  const handleAction = async (action: () => Promise<void> | void) => {
      await action();
      onClose();
  };

  return (
    <div 
      ref={menuRef}
      style={{ top: adjustedTop, left: adjustedLeft }}
      className="fixed z-50 w-48 rounded-md border border-slate-700 bg-slate-800 py-1 shadow-xl ring-1 ring-black/50"
    >
      <div className="px-3 py-2 border-b border-slate-700/50 mb-1">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
             {targetNode ? (targetNode.data.label || 'Node Actions') : 'Canvas Actions'}
         </span>
      </div>

      <button
        onClick={() => handleAction(() => copyNode(nodeId || undefined))}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <Copy size={14} /> {nodeId ? 'Copy' : 'Copy Selection'}
      </button>

      <button
        onClick={() => handleAction(() => {
             // Convert screen position of the menu to flow position for pasting
             const flowPos = screenToFlowPosition({ x: position.x, y: position.y });
             return pasteNode(flowPos);
        })}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <ClipboardPaste size={14} /> Paste
      </button>

      {nodeId && (
          <>
            <div className="my-1 h-px bg-slate-700/50" />
            <button
                onClick={() => handleAction(() => resetNode(nodeId))}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
            >
                <RotateCcw size={14} /> Reset to Defaults
            </button>
          </>
      )}
    </div>
  );
};

export default NodeContextMenu;