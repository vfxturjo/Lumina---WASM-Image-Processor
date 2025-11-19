import React, { useCallback, useMemo, useState, useEffect } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ConnectionMode,
  Node,
  useReactFlow,
  NodeMouseHandler
} from 'reactflow';
import { useExecution } from '../context/ExecutionContext';
import ImageInputNode from './nodes/ImageInputNode';
import BatchInputNode from './nodes/BatchInputNode';
import BatchConvertNode from './nodes/BatchConvertNode';
import BatchAssociateNode from './nodes/BatchAssociateNode';
import BatchInfoNode from './nodes/BatchInfoNode';
import FilterNode from './nodes/FilterNode';
import OutputNode from './nodes/OutputNode';
import MathNode from './nodes/MathNode';
import TableNode from './nodes/TableNode';
import JsonViewerNode from './nodes/JsonViewerNode';
import NodeContextMenu from './NodeContextMenu';
import { FilterDefinition } from '../types';

interface GraphCanvasProps {
  onNodeSelect: (nodeId: string | null) => void;
}

const GraphCanvas: React.FC<GraphCanvasProps> = ({ onNodeSelect }) => {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, copyNode, pasteNode } = useExecution();
  const { screenToFlowPosition } = useReactFlow();
  const [menu, setMenu] = useState<{ id: string | null; x: number; y: number } | null>(null);

  const nodeTypes = useMemo(() => ({
    imageInput: ImageInputNode,
    batchInput: BatchInputNode,
    batchConvert: BatchConvertNode,
    batchAssociate: BatchAssociateNode,
    batchInfo: BatchInfoNode,
    colorCorrection: FilterNode,
    blur: FilterNode,
    crop: FilterNode,
    addText: FilterNode,
    transformImage: FilterNode,
    imageBlend: FilterNode,
    output: OutputNode,
    math: MathNode,
    number: FilterNode,
    batchSort: FilterNode,
    imageGrid: FilterNode,
    textSource: TableNode, // Use Table visual for CSV
    table: TableNode,
    jsonViewer: JsonViewerNode
  }), []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is on an input/textarea/editable
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
      if ((e.target as HTMLElement).isContentEditable) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        copyNode(); // No ID -> copies selection
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteNode(); // No position -> pastes at viewport center
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copyNode, pasteNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const dataString = event.dataTransfer.getData('application/reactflow');
      if (!dataString) return;

      const nodeDef: FilterDefinition = JSON.parse(dataString);
      const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: nodeDef.type,
        position,
        data: { 
            label: nodeDef.label, 
            type: nodeDef.type,
            params: { ...nodeDef.defaultParams },
            code: nodeDef.defaultCode,
            dynamicInputs: nodeDef.defaultInputs,
            isDirty: true
        },
        style: (nodeDef.initialWidth && nodeDef.initialHeight) 
            ? { width: nodeDef.initialWidth, height: nodeDef.initialHeight } 
            : undefined
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  const onNodeContextMenu: NodeMouseHandler = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        x: event.clientX,
        y: event.clientY,
      });
    },
    []
  );

  const onPaneContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      setMenu({
        id: null, // Pane context
        x: event.clientX,
        y: event.clientY,
      });
      onNodeSelect(null);
    },
    [onNodeSelect]
  );

  const onPaneClick = useCallback(() => {
      setMenu(null);
      onNodeSelect(null);
  }, [onNodeSelect]);

  return (
    <>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onNodeClick={(_, node) => {
              setMenu(null);
              onNodeSelect(node.id);
          }}
          onPaneClick={onPaneClick}
          onNodeContextMenu={onNodeContextMenu}
          onPaneContextMenu={onPaneContextMenu}
          onMove={() => setMenu(null)}
          onDragOver={onDragOver}
          onDrop={onDrop}
          connectionMode={ConnectionMode.Loose}
          fitView
          className="bg-slate-950"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls />
          <MiniMap 
            className="!bg-slate-900 !border-slate-800" 
            maskColor="rgba(15, 23, 42, 0.8)"
            nodeColor={(n) => {
                if (n.type === 'imageInput') return '#4f46e5';
                if (n.type === 'output') return '#059669';
                if (n.type === 'math') return '#ea580c';
                if (n.type === 'batchInput') return '#c026d3';
                if (n.type === 'batchConvert') return '#a21caf';
                if (n.type === 'batchAssociate') return '#c026d3';
                if (n.type === 'table' || n.type === 'textSource') return '#0d9488';
                if (n.type === 'jsonViewer') return '#475569';
                return '#475569';
            }}
          />
        </ReactFlow>

        {menu && (
            <NodeContextMenu 
                nodeId={menu.id} 
                position={{ x: menu.x, y: menu.y }} 
                onClose={() => setMenu(null)} 
            />
        )}
    </>
  );
};

export default GraphCanvas;