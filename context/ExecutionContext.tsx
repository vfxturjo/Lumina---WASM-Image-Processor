import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Edge, useReactFlow } from 'reactflow';
import { AppNode, ExecutionContextType, NodeData } from '../types';
import { INITIAL_NODES, INITIAL_EDGES, AVAILABLE_NODES } from '../constants';

const ExecutionContext = createContext<ExecutionContextType | undefined>(undefined);

// --- PIXEL MANIPULATION UTILS ---

const boxBlur = (data: Uint8ClampedArray, width: number, height: number, radius: number) => {
  if (radius < 1) return;
  const stride = width * 4;
  const buffer = new Uint8ClampedArray(data);

  const blurLine = (src: Uint8ClampedArray, dst: Uint8ClampedArray, srcOffset: number, step: number, count: number) => {
      for (let i = 0; i < count; i++) {
         let r = 0, g = 0, b = 0, a = 0, hits = 0;
         for (let k = -radius; k <= radius; k++) {
             const pos = Math.min(count - 1, Math.max(0, i + k));
             const idx = srcOffset + pos * step;
             r += src[idx];
             g += src[idx + 1];
             b += src[idx + 2];
             a += src[idx + 3];
             hits++;
         }
         const dstIdx = srcOffset + i * step;
         dst[dstIdx] = r / hits;
         dst[dstIdx + 1] = g / hits;
         dst[dstIdx + 2] = b / hits;
         dst[dstIdx + 3] = a / hits;
      }
  };

  for (let y = 0; y < height; y++) {
      blurLine(buffer, data, y * width * 4, 4, width);
  }
  buffer.set(data);
  for (let x = 0; x < width; x++) {
      blurLine(buffer, data, x * 4, width * 4, height);
  }
};

const applyColorCorrection = (data: Uint8ClampedArray, params: Record<string, any>) => {
    const brightness = (params.brightness || 0);
    const contrast = (params.contrast || 1);
    const saturation = (params.saturation || 1);
    const temperature = (params.temperature || 0); 
    const tint = (params.tint || 0); 
    const vibrance = (params.vibrance || 0); 
    const whitePoint = (params.white !== undefined ? params.white : 255);
    const blackPoint = (params.black !== undefined ? params.black : 0);

    const contrastFactor = contrast;
    const levelScale = 255 / Math.max(1, whitePoint - blackPoint);
    
    for (let i = 0; i < data.length; i += 4) {
        let r = data[i];
        let g = data[i+1];
        let b = data[i+2];

        r += temperature; b -= temperature; g += tint;
        r += brightness; g += brightness; b += brightness;
        r = (r - blackPoint) * levelScale; g = (g - blackPoint) * levelScale; b = (b - blackPoint) * levelScale;
        r = ((r - 128) * contrastFactor) + 128; g = ((g - 128) * contrastFactor) + 128; b = ((b - 128) * contrastFactor) + 128;

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = gray + (r - gray) * saturation; g = gray + (g - gray) * saturation; b = gray + (b - gray) * saturation;

        if (vibrance !== 0) {
            const max = Math.max(r, g, b);
            const currentSat = (max - Math.min(r, g, b)) / (max || 1);
            const vibFactor = 1 + (vibrance * (1 - currentSat));
            r = gray + (r - gray) * vibFactor; g = gray + (g - gray) * vibFactor; b = gray + (b - gray) * vibFactor;
        }

        data[i] = Math.max(0, Math.min(255, r));
        data[i+1] = Math.max(0, Math.min(255, g));
        data[i+2] = Math.max(0, Math.min(255, b));
    }
};

// --- HELPER: Load Image for Canvas ---
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

// --- PROCESS SINGLE IMAGE FUNCTION (Extracted for Batch Re-use) ---
const processSingleImage = (
  type: string, 
  imgSrc: string | undefined,
  inputs: Record<string, any>, 
  params: any,
  getParam: (key: string, fallback: any) => any
): Promise<string | undefined> => {
    return new Promise((resolve) => {
        // If no image source, but explicit params.fileData (InputNode) use that
        // Otherwise if logic fails, return original src or undefined
        if (type === 'imageInput') {
            resolve(params.fileData);
            return;
        }
        
        // For Image Blend, we might have 'base' instead of generic input
        // But usually one is piped to main. Logic below handles multi-input manually.
        
        if (!imgSrc && type !== 'imageBlend') {
            resolve(undefined);
            return;
        }

        // If Blend, we need both images. If imgSrc is missing (base), we handle it inside.
        const loadPrimary = imgSrc ? loadImage(imgSrc) : Promise.resolve(null);

        loadPrimary.then(async (img) => {
            if (!img && type !== 'imageBlend') { resolve(undefined); return; }
            
            // Common Canvas Setup (if img exists)
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext('2d');
            
            if (img) {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx?.drawImage(img, 0, 0);
            }

            if (!ctx) { resolve(imgSrc); return; }

            if (type === 'blur') {
               const radius = getParam('radius', 0);
               const blurType = getParam('type', 'gaussian');
               if (blurType === 'gaussian') {
                   ctx.filter = `blur(${radius}px)`;
                   ctx.clearRect(0, 0, canvas.width, canvas.height);
                   ctx.drawImage(img!, 0, 0);
               } else if (blurType === 'box') {
                   const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                   boxBlur(imageData.data, canvas.width, canvas.height, radius);
                   ctx.putImageData(imageData, 0, 0);
               }
            } 
            else if (type === 'colorCorrection') {
               const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
               applyColorCorrection(imageData.data, {
                   brightness: getParam('brightness', 0),
                   contrast: getParam('contrast', 1),
                   temperature: getParam('temperature', 0),
                   tint: getParam('tint', 0),
                   saturation: getParam('saturation', 1),
                   vibrance: getParam('vibrance', 0),
                   white: getParam('white', 255),
                   black: getParam('black', 0),
               });
               ctx.putImageData(imageData, 0, 0);
            }
            else if (type === 'crop') {
                const x = getParam('x', 0);
                const y = getParam('y', 0);
                const w = getParam('width', 100);
                const h = getParam('height', 100);
                
                const safeW = Math.max(1, w);
                const safeH = Math.max(1, h);

                const cropCanvas = document.createElement('canvas');
                cropCanvas.width = safeW;
                cropCanvas.height = safeH;
                const cropCtx = cropCanvas.getContext('2d');
                if (cropCtx) {
                    cropCtx.drawImage(canvas, x, y, safeW, safeH, 0, 0, safeW, safeH);
                    resolve(cropCanvas.toDataURL('image/png'));
                    return;
                }
            }
            else if (type === 'addText') {
                // Inputs take precedence, then params
                const text = inputs['text'] !== undefined ? inputs['text'] : getParam('text', '');
                const x = getParam('x', 10);
                const y = getParam('y', 50);
                const size = getParam('size', 40);
                const color = getParam('color', '#ffffff');
                const opacity = getParam('opacity', 1);
                const rotation = getParam('rotation', 0);

                ctx.save();
                ctx.globalAlpha = opacity;
                ctx.fillStyle = color;
                ctx.font = `${size}px sans-serif`;
                ctx.textBaseline = 'top';
                
                ctx.translate(x, y);
                ctx.rotate((rotation * Math.PI) / 180);
                ctx.fillText(String(text), 0, 0);
                ctx.restore();
            }
            else if (type === 'transformImage') {
                if (!img) { resolve(undefined); return; }
                const x = getParam('x', 0);
                const y = getParam('y', 0);
                const scale = getParam('scale', 1.0);
                const rotation = getParam('rotation', 0);

                // Calculate New Bounding Box
                const angleRad = (rotation * Math.PI) / 180;
                const absCos = Math.abs(Math.cos(angleRad));
                const absSin = Math.abs(Math.sin(angleRad));

                const w = img.width * scale;
                const h = img.height * scale;

                // Bounding box of the ROTATED image
                const newW = Math.floor(w * absCos + h * absSin);
                const newH = Math.floor(w * absSin + h * absCos);

                // Final Width = newW + Math.abs(x)
                // Final Height = newH + Math.abs(y)
                const finalW = newW + Math.abs(x);
                const finalH = newH + Math.abs(y);

                const tCanvas = document.createElement('canvas');
                tCanvas.width = finalW;
                tCanvas.height = finalH;
                const tCtx = tCanvas.getContext('2d');
                
                if (tCtx) {
                    tCtx.save();
                    // Center of new canvas
                    const cx = finalW / 2;
                    const cy = finalH / 2;

                    // Apply user offset
                    tCtx.translate(cx + x, cy + y);
                    tCtx.rotate(angleRad);
                    tCtx.scale(scale, scale);
                    
                    // Draw centered at origin
                    tCtx.drawImage(img, -img.width / 2, -img.height / 2);
                    
                    tCtx.restore();
                    resolve(tCanvas.toDataURL('image/png'));
                    return;
                }
            }
            else if (type === 'imageBlend') {
                const baseSrc = inputs['base'];
                const layerSrc = inputs['layer'];
                
                const [baseImg, layerImg] = await Promise.all([
                    baseSrc ? loadImage(baseSrc) : Promise.resolve(null),
                    layerSrc ? loadImage(layerSrc) : Promise.resolve(null)
                ]);

                if (!baseImg && !layerImg) { resolve(undefined); return; }

                // Calculate Union Canvas Size
                const offX = getParam('x', 0);
                const offY = getParam('y', 0);
                
                const w1 = baseImg ? baseImg.width : 0;
                const h1 = baseImg ? baseImg.height : 0;
                const w2 = layerImg ? layerImg.width : 0;
                const h2 = layerImg ? layerImg.height : 0;

                const minX = Math.min(0, offX);
                const minY = Math.min(0, offY);
                const maxX = Math.max(w1, w2 + offX);
                const maxY = Math.max(h1, h2 + offY);
                
                const finalW = maxX - minX;
                const finalH = maxY - minY;
                
                const bCanvas = document.createElement('canvas');
                bCanvas.width = finalW;
                bCanvas.height = finalH;
                const bCtx = bCanvas.getContext('2d');
                
                if (bCtx) {
                    const originX = -minX; 
                    const originY = -minY;

                    // Draw Base
                    if (baseImg) {
                        bCtx.drawImage(baseImg, originX, originY);
                    }

                    // Draw Layer
                    if (layerImg) {
                        bCtx.save();
                        bCtx.globalCompositeOperation = getParam('mode', 'normal') as GlobalCompositeOperation;
                        bCtx.globalAlpha = getParam('opacity', 1);
                        bCtx.drawImage(layerImg, originX + offX, originY + offY);
                        bCtx.restore();
                    }
                    
                    resolve(bCanvas.toDataURL('image/png'));
                    return;
                }
            }
            
            resolve(canvas.toDataURL('image/png'));
        });
    });
};

// --- PROCESSOR ---
const processNodeOperation = async (
  type: string, 
  inputs: Record<string, any>, 
  params: any,
  data: NodeData
): Promise<Record<string, any>> => {
  
  const getParam = (key: string, fallback: any) => {
     const inputVal = inputs[key];
     if (inputVal !== undefined && inputVal !== null) {
         const num = parseFloat(inputVal);
         return isNaN(num) ? inputVal : num;
     }
     return params[key] ?? fallback;
  };

  // --- 1. Utilities (Math, Number, Output, Table, CSV) ---

  if (type === 'math') {
    return new Promise((resolve) => {
      try {
        const dynamicInputs = data.dynamicInputs || [];
        const code = data.code || '';
        const argNames = dynamicInputs.map(di => di.label);
        const argValues = dynamicInputs.map(di => inputs[di.id] ?? 0);
        const func = new Function(...argNames, code);
        const result = func(...argValues);
        resolve(typeof result === 'object' && result !== null ? result : { result });
      } catch (e: any) {
        resolve({ error: e.message });
      }
    });
  }

  if (type === 'number') return Promise.resolve({ value: getParam('value', params.value) });

  if (type === 'output') {
      const val = inputs['input'] ?? inputs['default'];
      return Promise.resolve({ value: val });
  }
  
  if (type === 'jsonViewer') {
      return Promise.resolve({ data: inputs['data'] });
  }

  if (type === 'table' || type === 'textSource') {
      const tableData = params.data || params.rows || [];
      return Promise.resolve({ data: tableData });
  }

  // --- 2. Batch Processing ---

  if (type === 'batchInput') {
      return Promise.resolve({ batch: params.files || [] });
  }

  // Batch Convert
  if (type === 'batchConvert') {
      const dynamicInputs = data.dynamicInputs || [];
      const newBatch = [];
      
      for (const di of dynamicInputs) {
          const val = inputs[di.id];
          if (val) {
              newBatch.push({ 
                  name: di.label, 
                  image: typeof val === 'string' ? val : undefined,
                  value: typeof val !== 'string' ? val : undefined
              });
          }
      }
      return Promise.resolve({ batch: newBatch });
  }

  // Batch Associate
  if (type === 'batchAssociate') {
      const batch = inputs['batch'] || [];
      const tableData = inputs['data'] || [];
      
      if (!batch.length || !tableData.length) return Promise.resolve({ batch });

      const batchKey = getParam('batchKey', 'name');
      const tableKey = getParam('tableKey', 'id'); 

      let headers: string[] = [];
      let rows: any[] = [];
      
      if (Array.isArray(tableData[0])) {
          headers = tableData[0].map(String);
          rows = tableData.slice(1);
      } else {
           return Promise.resolve({ batch }); 
      }

      const keyIndex = headers.findIndex(h => h === tableKey);
      const searchIndex = keyIndex >= 0 ? keyIndex : 0;

      const tableMap = new Map();
      rows.forEach(row => {
          const idVal = row[searchIndex];
          if (idVal) {
              const rowObj: Record<string, any> = {};
              headers.forEach((h, i) => {
                  rowObj[h] = row[i];
              });
              tableMap.set(idVal, rowObj);
          }
      });

      const newBatch = batch.map((item: any, index: number) => {
          const lookupVal = batchKey === 'index' ? String(index) : item[batchKey];
          const associatedData = tableMap.get(lookupVal);
          if (associatedData) return { ...item, ...associatedData };
          return item;
      });

      return Promise.resolve({ batch: newBatch });
  }

  // Shared Batch Logic
  if (type === 'batchSort' || type === 'batchInfo') {
      const batch = inputs['batch'] || [];

      if (type === 'batchSort') {
          const sortBy = getParam('sortBy', 'name');
          const direction = getParam('direction', 'asc');
          const sorted = [...batch].sort((a: any, b: any) => {
              const valA = a[sortBy] || '';
              const valB = b[sortBy] || '';
              if (valA < valB) return direction === 'asc' ? -1 : 1;
              if (valA > valB) return direction === 'asc' ? 1 : -1;
              return 0;
          });
          return Promise.resolve({ batch: sorted });
      }
      
      if (type === 'batchInfo') {
          const len = batch.length;
          let idx = getParam('index', 0);
          
          if (len === 0) return Promise.resolve({ count: 0, item: null, meta: null });
          if (idx >= len) idx = len - 1;
          if (idx < 0) idx = 0;
          
          const rawItem = batch[idx];
          const primaryValue = rawItem?.image || rawItem?.value || rawItem;

          return Promise.resolve({ 
              count: len, 
              item: primaryValue,
              meta: rawItem 
          });
      }
  }

  if (type === 'imageGrid') {
      const batch = inputs['batch'] || [];
      if (!Array.isArray(batch) || batch.length === 0) return Promise.resolve({ image: null });

      const cols = getParam('cols', 3);
      const gap = getParam('gap', 10);
      const showLabel = getParam('label', true);
      
      const loadedImages = await Promise.all(batch.map(async (item) => {
          if (!item.image) return null;
          try {
              const img = await loadImage(item.image);
              const labelText = item.name || item.label || ''; 
              return { img, name: labelText };
          } catch { return null; }
      }));

      const validImages = loadedImages.filter(i => i !== null) as {img: HTMLImageElement, name: string}[];
      if (validImages.length === 0) return Promise.resolve({ image: null });

      const cellWidth = validImages[0].img.width;
      const cellHeight = validImages[0].img.height;
      const rows = Math.ceil(validImages.length / cols);
      
      const canvas = document.createElement('canvas');
      canvas.width = (cols * cellWidth) + ((cols - 1) * gap);
      canvas.height = (rows * cellHeight) + ((rows - 1) * gap);
      const ctx = canvas.getContext('2d');

      if (!ctx) return Promise.resolve({});
      
      ctx.fillStyle = '#0f172a'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      validImages.forEach((item, i) => {
          const c = i % cols;
          const r = Math.floor(i / cols);
          const x = c * (cellWidth + gap);
          const y = r * (cellHeight + gap);
          
          ctx.drawImage(item.img, x, y, cellWidth, cellHeight);

          if (showLabel && item.name) {
              ctx.fillStyle = 'rgba(0,0,0,0.7)';
              ctx.fillRect(x, y + cellHeight - 30, cellWidth, 30);
              ctx.fillStyle = 'white';
              ctx.font = '14px sans-serif';
              ctx.fillText(item.name, x + 10, y + cellHeight - 10, cellWidth - 20);
          }
      });

      return Promise.resolve({ image: canvas.toDataURL('image/png') });
  }

  // --- 3. Image Operations (Supports Implicit Batching) ---

  const inputVal = inputs['image'] || inputs['input'] || inputs['base']; 

  if (Array.isArray(inputVal) && inputVal.length > 0 && type !== 'imageInput') {
      const processedBatch = await Promise.all(inputVal.map(async (item: any, index: number) => {
          const imgSrc = typeof item === 'string' ? item : item.image;
          const itemInputs = { ...inputs };

          if (type === 'addText') {
              const textKey = params.textKey;
              if (textKey && textKey !== 'none') {
                  let dynamicText = '';
                  if (textKey === 'index') {
                      dynamicText = String(index);
                  } else if (typeof item === 'object' && item[textKey] !== undefined) {
                      dynamicText = String(item[textKey]);
                  }
                  if (dynamicText) {
                      itemInputs['text'] = dynamicText;
                  }
              }
          }
          
          if (type === 'imageBlend') {
             itemInputs['base'] = imgSrc;
          }

          const processedImg = await processSingleImage(type, imgSrc, itemInputs, params, getParam);
          
          if (typeof item === 'object') {
              return { ...item, image: processedImg };
          } else {
              return { image: processedImg };
          }
      }));
      
      return { batch: processedBatch, image: processedBatch };
  }

  const singleImgSrc = typeof inputVal === 'string' ? inputVal : inputVal?.image;
  if (!singleImgSrc && type !== 'imageInput' && type !== 'imageBlend') return Promise.resolve({});

  const processedImage = await processSingleImage(type, singleImgSrc, inputs, params, getParam);
  return { image: processedImage };
};

export const ExecutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_NODES as AppNode[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [isPaused, setIsPaused] = useState(false);
  const [nodeCache, setNodeCache] = useState<Record<string, any>>({});
  const { screenToFlowPosition } = useReactFlow();

  const markDirty = useCallback((nodeId: string) => {
    setNodes((currentNodes) => {
      const descendants = new Set<string>();
      const queue = [nodeId];
      descendants.add(nodeId);
      while (queue.length > 0) {
        const current = queue.shift()!;
        const children = edges.filter(e => e.source === current).map(e => e.target);
        children.forEach(child => {
          if (!descendants.has(child)) {
            descendants.add(child);
            queue.push(child);
          }
        });
      }
      return currentNodes.map(n => descendants.has(n.id) ? { ...n, data: { ...n.data, isDirty: true, error: undefined } } : n);
    });
  }, [edges, setNodes]);

  const updateNodeParams = useCallback((nodeId: string, key: string, value: any) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, params: { ...node.data.params, [key]: value } } } : node));
    markDirty(nodeId);
  }, [markDirty, setNodes]);

  const updateNodeParamsBatch = useCallback((nodeId: string, updates: Record<string, any>) => {
    setNodes((nds) => nds.map((node) => {
        if (node.id === nodeId) {
            return { 
                ...node, 
                data: { 
                    ...node.data, 
                    params: { ...node.data.params, ...updates } 
                } 
            };
        }
        return node;
    }));
    markDirty(nodeId);
  }, [markDirty, setNodes]);

  const updateNodeData = useCallback((nodeId: string, newData: Partial<NodeData>) => {
    setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...newData } } : node));
    markDirty(nodeId);
  }, [markDirty, setNodes]);

  // --- COPY / PASTE (JSON based) ---

  const copyNode = useCallback(async (nodeId?: string) => {
    let nodesToCopy: AppNode[] = [];

    if (nodeId) {
        const targetNode = nodes.find(n => n.id === nodeId);
        if (targetNode) {
           // If target is explicitly selected, or if it's the only thing we are context-clicking
           // If we context-click a node that is NOT in the current selection, we usually copy JUST that node.
           // If we context-click a node that IS in the selection, we copy the whole selection.
           if (targetNode.selected) {
               nodesToCopy = nodes.filter(n => n.selected);
           } else {
               nodesToCopy = [targetNode];
           }
        }
    } else {
        // Keyboard shortcut case: copy all selected
        nodesToCopy = nodes.filter(n => n.selected);
    }

    if (nodesToCopy.length === 0) return;

    // Find edges that connect two nodes within the selection
    const nodeIds = new Set(nodesToCopy.map(n => n.id));
    const edgesToCopy = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const payload = {
      lumina: true,
      version: "1.0",
      nodes: nodesToCopy,
      edges: edgesToCopy
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  }, [nodes, edges]);

  const pasteNode = useCallback(async (position?: { x: number, y: number }) => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;

      const data = JSON.parse(text);
      if (!data.lumina || !Array.isArray(data.nodes)) return;

      const newNodes: AppNode[] = [];
      const newEdges: Edge[] = [];
      const idMap = new Map<string, string>();

      // Determine the "Center" of the clipboard data
      const xs = data.nodes.map((n: any) => n.position.x);
      const ys = data.nodes.map((n: any) => n.position.y);
      const minX = Math.min(...xs);
      const minY = Math.min(...ys);
      const width = Math.max(...xs) - minX;
      const height = Math.max(...ys) - minY;
      const contentCenterX = minX + width / 2;
      const contentCenterY = minY + height / 2;

      let targetX: number;
      let targetY: number;

      if (position) {
          targetX = position.x;
          targetY = position.y;
      } else {
          // Default to center of viewport
          // We use window center as a heuristic if available, or just 0,0
          const center = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
          targetX = center.x;
          targetY = center.y;
      }
      
      const offsetX = targetX - contentCenterX;
      const offsetY = targetY - contentCenterY;

      // Generate new IDs and Nodes
      data.nodes.forEach((node: any) => {
        // Generate a unique ID
        const newId = `${node.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(node.id, newId);

        newNodes.push({
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY
          },
          data: {
            ...node.data,
            isDirty: true // Mark dirty to trigger processing
          },
          selected: true // Select newly pasted nodes
        });
      });

      // Generate new Edges with updated IDs
      if (Array.isArray(data.edges)) {
        data.edges.forEach((edge: any) => {
          const source = idMap.get(edge.source);
          const target = idMap.get(edge.target);
          if (source && target) {
             newEdges.push({
               ...edge,
               id: `e_${source}_${target}_${Math.random().toString(36).substr(2, 5)}`,
               source,
               target,
               selected: false
             });
          }
        });
      }
      
      // Deselect existing nodes and add new ones
      setNodes((nds) => [...nds.map(n => ({ ...n, selected: false })), ...newNodes]);
      setEdges((eds) => [...eds, ...newEdges]);
      
    } catch (err) {
      console.error('Failed to paste from clipboard', err);
    }
  }, [setNodes, setEdges, screenToFlowPosition]);

  const resetNode = useCallback((nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return;

      const def = AVAILABLE_NODES.find(d => d.type === node.data.type);
      if (!def) return;

      setNodes((nds) => nds.map(n => {
          if (n.id === nodeId) {
             return {
                 ...n,
                 data: {
                     ...n.data,
                     params: JSON.parse(JSON.stringify(def.defaultParams)),
                     code: def.defaultCode,
                     dynamicInputs: def.defaultInputs ? JSON.parse(JSON.stringify(def.defaultInputs)) : undefined,
                     isDirty: true
                 }
             };
          }
          return n;
      }));
      markDirty(nodeId);
  }, [nodes, setNodes, markDirty]);


  const processGraph = useCallback(async () => {
    const adjacencyList: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    nodes.forEach(n => { adjacencyList[n.id] = []; inDegree[n.id] = 0; });
    edges.forEach(e => { if (adjacencyList[e.source]) { adjacencyList[e.source].push(e.target); inDegree[e.target] = (inDegree[e.target] || 0) + 1; } });
    const queue: string[] = [];
    nodes.forEach(n => { if (inDegree[n.id] === 0) queue.push(n.id); });
    const executionOrder: string[] = [];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      executionOrder.push(nodeId);
      adjacencyList[nodeId]?.forEach(neighbor => { inDegree[neighbor]--; if (inDegree[neighbor] === 0) queue.push(neighbor); });
    }

    const localRunCache = { ...nodeCache };

    for (const nodeId of executionOrder) {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        if (!node.data.isDirty && localRunCache[nodeId] !== undefined) continue;
        
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isProcessing: true } } : n));

        const incomingEdges = edges.filter(e => e.target === nodeId);
        const inputValues: Record<string, any> = {};
        incomingEdges.forEach(e => {
          const sourceResult = localRunCache[e.source];
          if (sourceResult) {
             const value = e.sourceHandle ? sourceResult[e.sourceHandle] : (sourceResult['image'] ?? sourceResult['value'] ?? sourceResult['batch'] ?? sourceResult['data'] ?? sourceResult);
             inputValues[e.targetHandle || 'default'] = value;
             
             if (e.targetHandle === 'batch' && !sourceResult['batch'] && Array.isArray(sourceResult['image'])) {
                 inputValues['batch'] = sourceResult['image'];
             }
             if (e.targetHandle === 'image' && !sourceResult['image'] && sourceResult['batch']) {
                 inputValues['image'] = sourceResult['batch'];
             }
          }
        });

        const paramsUsed = node.data.params;

        try {
          const result = await processNodeOperation(node.type || 'filter', inputValues, paramsUsed, node.data);
          
          localRunCache[nodeId] = result;
          setNodeCache(prev => ({ ...prev, [nodeId]: result }));
          
          setNodes(nds => {
              const childrenIds = edges.filter(e => e.source === nodeId).map(e => e.target);
              
              return nds.map(n => {
                  if (n.id === nodeId) {
                      const paramsChanged = paramsUsed !== n.data.params;
                      return { 
                          ...n, 
                          data: { 
                              ...n.data, 
                              isProcessing: false, 
                              isDirty: paramsChanged, 
                              error: undefined 
                          } 
                      };
                  }
                  if (childrenIds.includes(n.id)) {
                      return { ...n, data: { ...n.data, isDirty: true } };
                  }
                  return n;
              });
          });

        } catch (err: any) {
          setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: { ...n.data, isProcessing: false, isDirty: false, error: err.message } } : n));
        }
    }
  }, [nodes, edges, nodeCache, setNodes]);

  useEffect(() => {
    const timer = setTimeout(() => {
        if (nodes.some(n => n.data.isDirty) && !isPaused) processGraph();
    }, 100); 
    return () => clearTimeout(timer);
  }, [nodes, edges, processGraph, nodeCache, isPaused]);

  const onConnect = useCallback((params: Connection) => { setEdges((eds) => addEdge(params, eds)); markDirty(params.target || ''); }, [setEdges, markDirty]);
  const togglePause = useCallback(() => setIsPaused(prev => !prev), []);
  const getNodeOutput = (nodeId: string) => nodeCache[nodeId];

  return (
    <ExecutionContext.Provider value={{ nodes, edges, isPaused, setNodes, setEdges, onNodesChange, onEdgesChange, onConnect, processGraph, markDirty, updateNodeParams, updateNodeParamsBatch, updateNodeData, getNodeOutput, togglePause, copyNode, pasteNode, resetNode }}>
      {children}
    </ExecutionContext.Provider>
  );
};

export const useExecution = () => {
  const context = useContext(ExecutionContext);
  if (!context) throw new Error("useExecution must be used within ExecutionProvider");
  return context;
};