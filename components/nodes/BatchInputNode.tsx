import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { FolderInput, Files, Upload } from 'lucide-react';

const BatchInputNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams } = useExecution();
  const { data, id } = props;
  const mode = data.params.mode || 'multiple';

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList: Array<{name: string, image: string}> = [];
    
    // Process files
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onload = (event) => {
                    if (event.target?.result) {
                        fileList.push({
                            name: file.name,
                            image: event.target.result as string
                        });
                    }
                    resolve();
                };
                reader.readAsDataURL(file);
            });
        }
    }

    updateNodeParams(id, 'files', fileList);
  }, [id, updateNodeParams]);

  const count = data.params.files?.length || 0;

  return (
    <BaseNode 
        {...props} 
        title={mode === 'folder' ? 'Input Folder' : 'Input Multiple'} 
        icon={mode === 'folder' ? <FolderInput size={14}/> : <Files size={14}/>} 
        outputs={[{ id: 'batch', label: 'Batch', type: 'batch' }]}
        color="border-indigo-800"
    >
      <div className="flex flex-col gap-3 min-w-[160px]">
        <div className="relative group h-20 w-full overflow-hidden rounded bg-slate-950 border border-slate-800 flex items-center justify-center">
          <div className="text-center">
              <div className="text-2xl font-bold text-indigo-500">{count}</div>
              <div className="text-[10px] text-slate-500">Images Loaded</div>
          </div>
          
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
             <Upload size={24} className="text-white" />
             {/* React standard input doesn't support directory directly via props well in TS, casting required or use ref */}
             <input 
                type="file" 
                multiple 
                {...(mode === 'folder' ? { webkitdirectory: "", directory: "" } as any : {})}
                className="hidden" 
                onChange={handleFileChange} 
             />
          </label>
        </div>
        <div className="text-[10px] text-slate-500 text-center">
            {mode === 'folder' ? 'Select a folder' : 'Select multiple files'}
        </div>
      </div>
    </BaseNode>
  );
};

export default BatchInputNode;