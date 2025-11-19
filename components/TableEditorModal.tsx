
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Save, Trash2, Grid } from 'lucide-react';

interface TableEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: string[][]) => void;
  initialData: string[][];
  title: string;
}

const TableEditorModal: React.FC<TableEditorModalProps> = ({ isOpen, onClose, onSave, initialData, title }) => {
  // Ensure we strictly work with string[][]
  const [data, setData] = useState<string[][]>([]);

  useEffect(() => {
    if (isOpen) {
      // Deep copy and normalize data to ensure it is string[][]
      let normalized = (initialData && initialData.length > 0) 
        ? initialData.map(row => Array.isArray(row) ? row.map(String) : Object.values(row).map(String))
        : [['Header 1', 'Header 2'], ['Value 1', 'Value 2']];
      
      // Ensure at least one row exists for headers
      if (normalized.length === 0) {
          normalized = [['Header 1']];
      }
        
      setData(normalized);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newData = [...data];
    newData[rowIndex] = [...newData[rowIndex]];
    newData[rowIndex][colIndex] = value;
    setData(newData);
  };

  const addRow = () => {
    const colCount = data[0]?.length || 1;
    setData([...data, Array(colCount).fill('')]);
  };

  const addColumn = () => {
    setData(data.map(row => [...row, '']));
  };

  const removeRow = (index: number) => {
    // Prevent removing the header row (index 0) if it's the only one left? 
    // Actually, we should allow removing body rows.
    // If index is 0, that's the header. We shouldn't allow removing header row via this generic method usually, 
    // unless we want to destroy the table structure.
    // The UI for removeRow below will be for body rows (index > 0).
    if (data.length <= 1 && index === 0) return; 
    
    setData(data.filter((_, i) => i !== index));
  };

  const removeColumn = (colIndex: number) => {
    if (data[0].length <= 1) return;
    setData(data.map(row => row.filter((_, i) => i !== colIndex)));
  };

  const handleSave = () => {
    onSave(data);
    onClose();
  };

  const headers = data[0] || [];
  const body = data.slice(1);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="flex flex-col w-full max-w-4xl h-[80vh] bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800">
          <div className="flex items-center gap-2">
            <Grid className="text-indigo-500" size={20} />
            <h2 className="text-lg font-bold text-slate-200">Edit Table: {title}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded hover:bg-slate-700 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-slate-950 border-b border-slate-800">
          <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors">
            <Plus size={14} /> Add Row
          </button>
          <button onClick={addColumn} className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded border border-slate-700 transition-colors">
            <Plus size={14} /> Add Column
          </button>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto p-4 bg-slate-950">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 w-10 bg-slate-900 border border-slate-800"></th>
                {headers.map((cell, colIndex) => (
                  <th key={`head-${colIndex}`} className="bg-slate-900 border border-slate-800 p-0 min-w-[100px] group relative">
                    <input
                        className="w-full bg-transparent px-2 py-2 text-xs font-bold text-slate-300 outline-none focus:bg-slate-800 placeholder-slate-600"
                        value={cell}
                        onChange={(e) => handleCellChange(0, colIndex, e.target.value)}
                        placeholder={`Header ${colIndex + 1}`}
                    />
                    <button 
                        onClick={() => removeColumn(colIndex)} 
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 p-1 bg-slate-900 rounded shadow-sm"
                        title="Remove Column"
                    >
                        <Trash2 size={12} />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((row, rowIndex) => {
                // Adjust index because data[0] is header
                const actualIndex = rowIndex + 1;
                return (
                  <tr key={`row-${actualIndex}`}>
                    <td className="bg-slate-900 border border-slate-800 text-center w-10 group">
                      <div className="flex items-center justify-center">
                          <span className="text-xs text-slate-600 group-hover:hidden">{rowIndex + 1}</span>
                          <button 
                              onClick={() => removeRow(actualIndex)}
                              className="hidden group-hover:block text-slate-600 hover:text-red-500"
                              title="Remove Row"
                          >
                              <Trash2 size={12} />
                          </button>
                      </div>
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={`${actualIndex}-${colIndex}`} className="border border-slate-800 p-0">
                        <input
                          className="w-full bg-transparent px-2 py-2 text-sm text-slate-300 outline-none focus:bg-indigo-900/20 focus:text-white transition-colors"
                          value={cell}
                          onChange={(e) => handleCellChange(actualIndex, colIndex, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {body.length === 0 && (
              <div className="p-8 text-center text-slate-600 text-sm italic border border-slate-800 border-t-0 bg-slate-900/30">
                  No data rows. Click "Add Row" to start adding data.
              </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-800 bg-slate-900">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded shadow-lg shadow-indigo-500/20 transition-all">
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TableEditorModal;
