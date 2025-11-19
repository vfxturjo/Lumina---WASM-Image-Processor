
import React, { useCallback, useState } from 'react';
import { NodeProps } from 'reactflow';
import { useExecution } from '../../context/ExecutionContext';
import { NodeData } from '../../types';
import BaseNode from './BaseNode';
import TableEditorModal from '../TableEditorModal';
import { Table as TableIcon, Upload, Download, Edit } from 'lucide-react';

const TableNode: React.FC<NodeProps<NodeData>> = (props) => {
  const { updateNodeParams } = useExecution();
  const { id, data } = props;
  const [isEditing, setIsEditing] = useState(false);

  const rows = data.params.rows || data.params.data || [];
  
  // Logic to handle header separation
  // We treat the first row as header if it exists, so data rows is total - 1
  const dataRowCount = Math.max(0, rows.length - 1);
  
  // Preview logic
  // We want to show a few data rows. 
  // If we slice 0..5, we get 1 header + 4 data rows.
  const previewRows = rows.slice(0, 5);
  const displayedDataRows = Math.max(0, previewRows.length - 1);
  
  const headers = previewRows.length > 0 ? (Array.isArray(previewRows[0]) ? previewRows[0] : Object.keys(previewRows[0])) : [];
  const isArrayMode = previewRows.length > 0 && Array.isArray(previewRows[0]);
  const isCSV = data.type === 'textSource';

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const text = evt.target?.result as string;
        // Basic CSV parser: split by newline then comma
        const lines = text.split('\n').map(l => l.trim()).filter(l => l);
        const parsedData = lines.map(l => l.split(',')); 
        updateNodeParams(id, 'data', parsedData);
    };
    reader.readAsText(file);
  }, [id, updateNodeParams]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!rows || rows.length === 0) return;
    // Basic CSV generation
    const csvContent = rows.map((r: any[]) => Array.isArray(r) ? r.join(',') : Object.values(r).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${data.label.replace(/\s+/g, '_') || 'data'}.csv`;
    link.click();
  };

  const handleSaveData = (newData: string[][]) => {
      const paramKey = isCSV ? 'data' : 'rows';
      updateNodeParams(id, paramKey, newData);
  };

  return (
    <>
      <BaseNode 
          {...props} 
          title={data.label} 
          icon={<TableIcon size={14}/>} 
          outputs={[{ id: 'data', label: 'Data', type: 'any' }]}
          color="border-teal-700"
      >
        <div className="flex flex-col gap-2 min-w-[200px]">
          <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden relative">
             {rows.length === 0 ? (
                 <div className="p-4 text-center text-[10px] text-slate-500">No Data</div>
             ) : (
                 <table className="w-full text-[9px] text-slate-300 text-left">
                     <thead className="bg-slate-900 text-slate-400">
                         <tr>
                             {isArrayMode 
                                 ? headers.map((h: any, i: number) => <th key={i} className="p-1 font-mono border-b border-slate-800">{h}</th>)
                                 : headers.map((h: any) => <th key={h} className="p-1 font-mono border-b border-slate-800">{h}</th>)
                             }
                         </tr>
                     </thead>
                     <tbody>
                         {previewRows.slice(1).map((row: any, i: number) => (
                             <tr key={i} className="border-b border-slate-800/50 last:border-0">
                                 {isArrayMode
                                     ? row.map((cell: any, j: number) => <td key={j} className="p-1 truncate max-w-[50px]">{cell}</td>)
                                     : headers.map((h: any) => <td key={h} className="p-1 truncate max-w-[50px]">{row[h]}</td>)
                                 }
                             </tr>
                         ))}
                     </tbody>
                 </table>
             )}
          </div>
          
          <div className="grid grid-cols-3 gap-1">
              {isCSV ? (
                  <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors" title="Import CSV">
                      <Upload size={10} /> Import
                      <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                  </label>
              ) : (
                <div className="bg-transparent" /> /* Spacer if not CSV */
              )}

              <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-800 text-indigo-200 text-[10px] py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors"
                  title="Open Table Editor"
              >
                  <Edit size={10} /> Edit
              </button>

              <button 
                  onClick={handleDownload}
                  disabled={rows.length === 0}
                  className={`border border-slate-700 text-slate-300 text-[10px] py-1 px-2 rounded flex items-center justify-center gap-1 transition-colors ${rows.length === 0 ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
                  title="Export CSV"
              >
                  <Download size={10} /> Export
              </button>
          </div>

          <div className="text-[10px] text-slate-500 flex justify-between px-1">
              <span>{dataRowCount} Rows</span>
              {dataRowCount > displayedDataRows && <span>(Previewing {displayedDataRows})</span>}
          </div>
        </div>
      </BaseNode>

      <TableEditorModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        onSave={handleSaveData}
        initialData={rows}
        title={data.label}
      />
    </>
  );
};

export default TableNode;
