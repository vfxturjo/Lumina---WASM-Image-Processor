import React, { useMemo } from 'react';
import { AVAILABLE_NODES } from '../constants';
import { FilterDefinition } from '../types';
import { Grid, Image as ImageIcon, Sliders, Eye, Calculator, Box } from 'lucide-react';

const Sidebar: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeDef: FilterDefinition) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeDef));
    event.dataTransfer.effectAllowed = 'move';
  };

  // Dynamically derive unique categories from the available nodes
  const categories = useMemo(() => {
    return Array.from(new Set(AVAILABLE_NODES.map(n => n.category)));
  }, []);

  const getIcon = (category: string) => {
      switch(category) {
          case 'Input': return <ImageIcon size={14} />;
          case 'Filter': return <Sliders size={14} />;
          case 'Output': return <Eye size={14} />;
          case 'Utility': return <Calculator size={14} />;
          case 'Transform': return <Box size={14} />;
          default: return <Grid size={14} />;
      }
  }

  return (
    <aside className="w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900 hidden md:flex z-10">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Node Palette</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {categories.map(category => (
            <div key={category}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase text-slate-500 flex items-center gap-2">
                    {getIcon(category)} {category}
                </h3>
                <div className="grid gap-2">
                    {AVAILABLE_NODES.filter(n => n.category === category).map(node => (
                        <div
                            key={node.type}
                            className="cursor-grab rounded border border-slate-700 bg-slate-800 p-3 text-sm text-slate-300 shadow-sm transition-all hover:border-indigo-500 hover:bg-slate-750 active:cursor-grabbing"
                            onDragStart={(event) => onDragStart(event, node)}
                            draggable
                        >
                            <div className="font-medium">{node.label}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{node.description}</div>
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;