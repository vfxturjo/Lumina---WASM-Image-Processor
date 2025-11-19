import { Node, Edge } from 'reactflow';

// --- Node Data Types ---

export type NodeType = 
  | 'imageInput' 
  | 'batchInput'
  | 'number' 
  | 'math' 
  | 'colorCorrection' 
  | 'blur' 
  | 'crop'
  | 'addText'
  | 'batchConvert'
  | 'batchSort'
  | 'batchInfo'
  | 'batchAssociate'
  | 'imageGrid'
  | 'textSource' // CSV
  | 'table'
  | 'jsonViewer'
  | 'output'
  | 'transformImage'
  | 'imageBlend';

export interface DynamicInput {
  id: string;
  label: string;
}

export interface ParamConfig {
  key: string;
  type: 'int' | 'float' | 'text' | 'select' | 'boolean' | 'color' | 'textarea';
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

export interface NodeData {
  label: string;
  type: NodeType;
  // Stores parameters like slider values, dropdown choices
  params: Record<string, any>;
  // The result is now typically an object mapping outputId -> value
  output?: any;
  // For Math/Code nodes
  code?: string;
  dynamicInputs?: DynamicInput[];
  // Execution state
  isProcessing?: boolean;
  isDirty?: boolean;
  error?: string;
}

export type AppNode = Node<NodeData>;

// --- Execution Engine Types ---

export interface ExecutionContextType {
  nodes: AppNode[];
  edges: Edge[];
  isPaused: boolean;
  setNodes: (nodes: AppNode[] | ((nds: AppNode[]) => AppNode[])) => void;
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void;
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: any) => void;
  processGraph: () => Promise<void>;
  markDirty: (nodeId: string) => void;
  updateNodeParams: (nodeId: string, key: string, value: any) => void;
  updateNodeParamsBatch: (nodeId: string, updates: Record<string, any>) => void;
  updateNodeData: (nodeId: string, newData: Partial<NodeData>) => void;
  getNodeOutput: (nodeId: string) => any;
  togglePause: () => void;
  copyNode: (nodeId?: string) => Promise<void>;
  pasteNode: (position?: { x: number; y: number }) => Promise<void>;
  resetNode: (nodeId: string) => void;
}

export interface IOSocketDef {
  id: string;
  label: string;
  type: string; // 'image' | 'number' | 'any' | 'batch' | 'text'
}

export interface FilterDefinition {
  type: string;
  label: string;
  description: string;
  category: 'Input' | 'Filter' | 'Transform' | 'Output' | 'Utility' | 'Batch' | 'Text';
  defaultParams: Record<string, any>;
  // UI Configuration for parameters
  paramConfig?: ParamConfig[];
  // Default code for math nodes
  defaultCode?: string;
  // Initial dynamic inputs for math nodes
  defaultInputs?: DynamicInput[];
  // Inputs and Outputs definition
  inputs: IOSocketDef[];
  outputs: IOSocketDef[];
  // Initial Dimensions for resizable nodes
  initialWidth?: number;
  initialHeight?: number;
}