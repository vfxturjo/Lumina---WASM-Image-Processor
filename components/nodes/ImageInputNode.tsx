import React, { useCallback } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import { Image as ImageIcon, Upload } from 'lucide-react';

const ImageInputNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams } = useExecution();
  const { data, id } = props;

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result;
        // We store the raw file data in params for the processor to pick up
        updateNodeParams(id, 'fileData', result);
      };
      reader.readAsDataURL(file);
    }
  }, [id, updateNodeParams]);

  const preview = data.params?.fileData;

  return (
    <BaseNode 
        {...props} 
        title="Input Image" 
        icon={<ImageIcon size={14}/>} 
        outputs={[{ id: 'image', label: 'Image', type: 'image' }]}
        color="border-indigo-800"
    >
      <div className="flex flex-col gap-3 max-w-[220px]">
        <div className="relative group h-24 w-full overflow-hidden rounded bg-slate-950 border border-slate-800 flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Input" className="h-full w-full object-cover opacity-80" />
          ) : (
            <span className="text-xs text-slate-600">No Image</span>
          )}
          
          <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
             <Upload size={20} className="text-white" />
             <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>
        <div className="text-[10px] text-slate-500 text-center">
            {preview ? 'Click image to change' : 'Upload an image'}
        </div>
      </div>
    </BaseNode>
  );
};

export default ImageInputNode;