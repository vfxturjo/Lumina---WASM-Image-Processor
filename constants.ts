import { FilterDefinition } from './types';

export const AVAILABLE_NODES: FilterDefinition[] = [
  // --- INPUTS ---
  {
    type: 'imageInput',
    label: 'Input Image',
    description: 'Load a single image from local device.',
    category: 'Input',
    defaultParams: {},
    inputs: [],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },
  {
    type: 'batchInput', // Reusing component logic for folder/multiple
    label: 'Input Folder',
    description: 'Load all images from a local folder.',
    category: 'Input',
    defaultParams: { mode: 'folder', files: [] },
    inputs: [],
    outputs: [{ id: 'batch', label: 'Batch', type: 'batch' }]
  },
  {
    type: 'batchInput',
    label: 'Input Multiple',
    description: 'Select multiple image files.',
    category: 'Input',
    defaultParams: { mode: 'multiple', files: [] },
    inputs: [],
    outputs: [{ id: 'batch', label: 'Batch', type: 'batch' }]
  },

  // --- UTILITY ---
  {
    type: 'number',
    label: 'Number',
    description: 'A constant number value.',
    category: 'Utility',
    defaultParams: { value: 1 },
    paramConfig: [
      { key: 'value', type: 'float', label: 'Value', min: -1000, max: 1000, step: 0.1 }
    ],
    inputs: [],
    outputs: [{ id: 'value', label: 'Value', type: 'number' }]
  },
  {
    type: 'math',
    label: 'Math / Code',
    description: 'Execute custom JavaScript code.',
    category: 'Utility',
    defaultParams: {},
    defaultCode: 'return { result: (a || 0) + (b || 0) };',
    defaultInputs: [
      { id: 'a', label: 'a' },
      { id: 'b', label: 'b' }
    ],
    inputs: [],
    outputs: [{ id: 'result', label: 'Result', type: 'any' }]
  },

  // --- BATCH HANDLING ---
  {
    type: 'batchConvert',
    label: 'Convert to Batch',
    description: 'Combine multiple single inputs into a batch.',
    category: 'Batch',
    defaultParams: {},
    // Inputs will be dynamic, managed by inspector or node UI
    defaultInputs: [],
    inputs: [], 
    outputs: [{ id: 'batch', label: 'Batch', type: 'batch' }]
  },
  {
    type: 'batchAssociate',
    label: 'Batch Associate Table',
    description: 'Join batch items with table data via ID.',
    category: 'Batch',
    defaultParams: { batchKey: 'name', tableKey: 'id' },
    paramConfig: [
        { key: 'batchKey', type: 'select', label: 'Batch Property (ID)', options: ['name', 'index'] },
        { key: 'tableKey', type: 'text', label: 'Table Column (ID)' }
    ],
    inputs: [
        { id: 'batch', label: 'Batch', type: 'batch' },
        { id: 'data', label: 'Table Data', type: 'any' }
    ],
    outputs: [{ id: 'batch', label: 'Associated Batch', type: 'batch' }]
  },
  {
    type: 'batchSort',
    label: 'Batch Sort',
    description: 'Sort a batch by filename or property.',
    category: 'Batch',
    defaultParams: { sortBy: 'name', direction: 'asc' },
    paramConfig: [
        { key: 'sortBy', type: 'select', label: 'Sort By', options: ['name', 'size', 'date'] },
        { key: 'direction', type: 'select', label: 'Direction', options: ['asc', 'desc'] }
    ],
    inputs: [{ id: 'batch', label: 'Batch', type: 'batch' }],
    outputs: [{ id: 'batch', label: 'Sorted', type: 'batch' }]
  },
  {
    type: 'imageGrid',
    label: 'Create Image Grid',
    description: 'Merge a batch of images into a single grid.',
    category: 'Batch',
    defaultParams: { cols: 3, gap: 10, label: true },
    paramConfig: [
        { key: 'cols', type: 'int', label: 'Columns', min: 1, max: 20, step: 1 },
        { key: 'gap', type: 'int', label: 'Gap (px)', min: 0, max: 100, step: 1 },
        { key: 'label', type: 'boolean', label: 'Show Labels' }
    ],
    inputs: [{ id: 'batch', label: 'Batch', type: 'batch' }],
    outputs: [{ id: 'image', label: 'Grid Image', type: 'image' }]
  },
  {
    type: 'batchInfo',
    label: 'Batch Inspector',
    description: 'Inspect items, extract by index, and view details.',
    category: 'Batch',
    defaultParams: { index: 0 },
    paramConfig: [
        { key: 'index', type: 'int', label: 'Index', min: 0, max: 1000, step: 1 }
    ],
    inputs: [{ id: 'batch', label: 'Batch', type: 'batch' }],
    outputs: [
        { id: 'item', label: 'Item', type: 'any' },
        { id: 'count', label: 'Count', type: 'number' },
        { id: 'meta', label: 'Metadata', type: 'any' }
    ]
  },

  // --- TEXT & DATA ---
  {
    type: 'textSource',
    label: 'Load CSV',
    description: 'Load a CSV file as a data array.',
    category: 'Text',
    defaultParams: { data: [] },
    inputs: [],
    outputs: [{ id: 'data', label: 'Data', type: 'any' }]
  },
  {
    type: 'table',
    label: 'Create Table',
    description: 'Create and edit a data table internally.',
    category: 'Text',
    defaultParams: { rows: [['id', 'text'], ['1', 'hello']] },
    inputs: [],
    outputs: [{ id: 'data', label: 'Data', type: 'any' }]
  },
  {
    type: 'addText',
    label: 'Add Text on Image',
    description: 'Overlay text onto an image.',
    category: 'Text',
    defaultParams: { 
        text: 'Lumina', textKey: 'none', x: 10, y: 50, size: 40, 
        color: '#ffffff', opacity: 1, rotation: 0 
    },
    paramConfig: [
        { key: 'text', type: 'text', label: 'Text Content' },
        { key: 'textKey', type: 'select', label: 'Batch Key (Override)', options: ['none', 'name', 'index', 'label', 'value', 'id'] },
        { key: 'x', type: 'int', label: 'X Pos', min: 0, max: 2000, step: 10 },
        { key: 'y', type: 'int', label: 'Y Pos', min: 0, max: 2000, step: 10 },
        { key: 'size', type: 'int', label: 'Font Size', min: 8, max: 200, step: 1 },
        { key: 'color', type: 'color', label: 'Color' },
        { key: 'opacity', type: 'float', label: 'Opacity', min: 0, max: 1, step: 0.1 },
        { key: 'rotation', type: 'int', label: 'Rotation', min: -180, max: 180, step: 5 }
    ],
    inputs: [
        { id: 'image', label: 'Image', type: 'image' },
        { id: 'text', label: 'Text Override', type: 'text' }
    ],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },

  // --- MANIPULATION / FILTERS ---
  {
    type: 'transformImage',
    label: 'Transform Image',
    description: 'Scale, rotate, and move image. Canvas grows to fit.',
    category: 'Transform',
    defaultParams: { x: 0, y: 0, scale: 1.0, rotation: 0 },
    paramConfig: [
        { key: 'x', type: 'int', label: 'Translate X', min: -2000, max: 2000, step: 1 },
        { key: 'y', type: 'int', label: 'Translate Y', min: -2000, max: 2000, step: 1 },
        { key: 'scale', type: 'float', label: 'Scale', min: 0.1, max: 5, step: 0.1 },
        { key: 'rotation', type: 'int', label: 'Rotation', min: -180, max: 180, step: 5 }
    ],
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },
  {
      type: 'imageBlend',
      label: 'Image Blend',
      description: 'Blend two images using standard modes.',
      category: 'Transform',
      defaultParams: { mode: 'normal', opacity: 1, x: 0, y: 0 },
      paramConfig: [
          { key: 'mode', type: 'select', label: 'Blend Mode', 
            options: ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'] 
          },
          { key: 'opacity', type: 'float', label: 'Opacity', min: 0, max: 1, step: 0.05 },
          { key: 'x', type: 'int', label: 'Layer X', min: -2000, max: 2000, step: 10 },
          { key: 'y', type: 'int', label: 'Layer Y', min: -2000, max: 2000, step: 10 }
      ],
      inputs: [
          { id: 'base', label: 'Base (Bottom)', type: 'image' },
          { id: 'layer', label: 'Layer (Top)', type: 'image' }
      ],
      outputs: [{ id: 'image', label: 'Result', type: 'image' }]
  },
  {
    type: 'crop',
    label: 'Crop',
    description: 'Crop the image to specific dimensions.',
    category: 'Transform',
    defaultParams: { x: 0, y: 0, width: 500, height: 500 },
    paramConfig: [
        { key: 'x', type: 'int', label: 'X', min: 0, max: 12000, step: 1 },
        { key: 'y', type: 'int', label: 'Y', min: 0, max: 12000, step: 1 },
        { key: 'width', type: 'int', label: 'Width', min: 1, max: 12000, step: 1 },
        { key: 'height', type: 'int', label: 'Height', min: 1, max: 12000, step: 1 }
    ],
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },
  {
    type: 'colorCorrection',
    label: 'Color Correction',
    description: 'Adjust exposure, color, and tone.',
    category: 'Filter',
    defaultParams: { 
      brightness: 0, 
      contrast: 1, 
      temperature: 0, 
      tint: 0, 
      saturation: 1, 
      vibrance: 0, 
      white: 255, 
      black: 0 
    },
    paramConfig: [
      { key: 'brightness', type: 'float', label: 'Brightness', min: -100, max: 100, step: 1 },
      { key: 'contrast', type: 'float', label: 'Contrast', min: 0, max: 3, step: 0.1 },
      { key: 'temperature', type: 'float', label: 'Temperature', min: -100, max: 100, step: 1 },
      { key: 'tint', type: 'float', label: 'Tint', min: -100, max: 100, step: 1 },
      { key: 'saturation', type: 'float', label: 'Saturation', min: 0, max: 3, step: 0.1 },
      { key: 'vibrance', type: 'float', label: 'Vibrance', min: -1, max: 1, step: 0.1 },
      { key: 'white', type: 'int', label: 'White Point', min: 0, max: 255, step: 1 },
      { key: 'black', type: 'int', label: 'Black Point', min: 0, max: 255, step: 1 }
    ],
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },
  {
    type: 'blur',
    label: 'Blur',
    description: 'Apply Gaussian or Box blur.',
    category: 'Filter',
    defaultParams: { radius: 5, type: 'gaussian' },
    paramConfig: [
      { key: 'type', type: 'select', label: 'Type', options: ['gaussian', 'box'] },
      { key: 'radius', type: 'int', label: 'Radius', min: 0, max: 100, step: 1 }
    ],
    inputs: [{ id: 'image', label: 'Image', type: 'image' }],
    outputs: [{ id: 'image', label: 'Image', type: 'image' }]
  },
  {
    type: 'output',
    label: 'Viewer',
    description: 'View final result.',
    category: 'Output',
    defaultParams: {},
    inputs: [{ id: 'input', label: 'Result', type: 'any' }],
    outputs: [],
    initialWidth: 300,
    initialHeight: 300
  },
  {
    type: 'jsonViewer',
    label: 'JSON Viewer',
    description: 'View JSON safely (truncates huge strings).',
    category: 'Output',
    defaultParams: {},
    inputs: [{ id: 'data', label: 'Data', type: 'any' }],
    outputs: []
  }
];

export const INITIAL_NODES = [
  {
    id: '1',
    type: 'imageInput',
    position: { x: 100, y: 100 },
    data: { label: 'Input Image', type: 'imageInput', params: {} }
  },
  {
    id: '2',
    type: 'colorCorrection',
    position: { x: 400, y: 100 },
    data: { 
      label: 'Color Correction', 
      type: 'colorCorrection', 
      params: { 
        brightness: 0, 
        contrast: 1.2, 
        temperature: 10, 
        saturation: 1.1,
        white: 255,
        black: 0
      } 
    }
  },
  {
    id: '3',
    type: 'output',
    position: { x: 750, y: 100 },
    data: { label: 'Viewer', type: 'output', params: {} },
    style: { width: 300, height: 300 }
  }
];

export const INITIAL_EDGES = [
  { id: 'e1-2', source: '1', sourceHandle: 'image', target: '2', targetHandle: 'image', animated: true, style: { stroke: '#6366f1' } },
  { id: 'e2-3', source: '2', sourceHandle: 'image', target: '3', targetHandle: 'input', animated: true, style: { stroke: '#6366f1' } }
];