import React, { useState, useEffect } from 'react';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Plus, 
  Trash2, 
  Layout as LayoutIcon,
  Smartphone,
  Lock,
  X,
  Save,
  RotateCcw
} from 'lucide-react';
import { LayoutService, LayoutField, ObjectType } from '../../../services/layoutService';

const LayoutBuilder: React.FC = () => {
  const [activeObject, setActiveObject] = useState<ObjectType>('Leads');
  const [layouts, setLayouts] = useState<Record<ObjectType, LayoutField[]>>(LayoutService.getAllLayouts());
  const [isDirty, setIsDirty] = useState(false);

  const activeLayout = layouts[activeObject];
  const visibleFields = activeLayout.filter(f => f.visible);

  const handleSave = () => {
    LayoutService.saveLayout(activeObject, activeLayout);
    setIsDirty(false);
    // Force a small delay to show feedback
    const btn = document.getElementById('save-layout-btn');
    if(btn) {
        const originalText = btn.innerText;
        btn.innerText = 'Saved!';
        setTimeout(() => btn.innerText = originalText, 2000);
    }
  };

  const handleReset = () => {
    if(confirm('Reset all layouts to default?')) {
        LayoutService.resetDefaults();
        setLayouts(LayoutService.getAllLayouts());
        setIsDirty(false);
    }
  };

  const updateField = (fieldId: string, updates: Partial<LayoutField>) => {
    setLayouts(prev => ({
      ...prev,
      [activeObject]: prev[activeObject].map(f => 
        f.id === fieldId ? { ...f, ...updates } : f
      )
    }));
    setIsDirty(true);
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === activeLayout.length - 1)) return;
    
    const newArr = [...activeLayout];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newArr[swapIndex], newArr[index]] = [newArr[index], newArr[swapIndex]];
    
    setLayouts(prev => ({ ...prev, [activeObject]: newArr }));
    setIsDirty(true);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Object Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 w-fit">
            {(['Leads', 'Bookings', 'Tours'] as ObjectType[]).map(obj => (
            <button
                key={obj}
                onClick={() => setActiveObject(obj)}
                className={`px-6 py-2 text-sm font-bold rounded-xl transition-all ${
                activeObject === obj 
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
            >
                {obj}
            </button>
            ))}
        </div>

        <div className="flex gap-2">
            <button 
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2"
            >
                <RotateCcw className="w-4 h-4" /> Reset
            </button>
            <button 
                id="save-layout-btn"
                onClick={handleSave}
                disabled={!isDirty}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
            >
                <Save className="w-4 h-4" /> Save Layout
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Form Layout</h4>
                <p className="text-xs text-gray-500 mt-0.5">Drag to reorder. Toggle visibility and rules.</p>
              </div>
              <button className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {activeLayout.map((field, idx) => (
                <div key={field.id} className={`p-4 flex items-center gap-4 group transition-colors ${!field.visible ? 'bg-gray-50/50 dark:bg-gray-900/20 opacity-60' : 'hover:bg-gray-50/50 dark:hover:bg-gray-900/30'}`}>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onClick={() => moveField(idx, 'up')} className="text-gray-400 hover:text-indigo-500 p-0.5"><ChevronUp className="w-3 h-3"/></button>
                     <button onClick={() => moveField(idx, 'down')} className="text-gray-400 hover:text-indigo-500 p-0.5"><ChevronDown className="w-3 h-3"/></button>
                  </div>
                  <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-grab" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                       <span className="text-sm font-bold text-gray-900 dark:text-white truncate">{field.label}</span>
                       {field.required && <span className="text-red-500 font-bold">*</span>}
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{field.type}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Required Toggle */}
                    <button 
                      onClick={() => updateField(field.id, { required: !field.required })}
                      disabled={field.isCore}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${field.required ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'} ${field.isCore ? 'cursor-not-allowed opacity-70' : ''}`}
                      title={field.isCore ? "Core fields must be required" : "Toggle Mandatory"}
                    >
                      <Lock className={`w-3 h-3 ${field.required ? '' : 'opacity-30'}`} />
                      Req
                    </button>

                    {/* Visibility Toggle */}
                    <button 
                      onClick={() => updateField(field.id, { visible: !field.visible })}
                      className={`p-2 rounded-lg transition-all ${field.visible ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      title={field.visible ? "Hide field" : "Show field"}
                    >
                      {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button disabled={field.isCore} className={`p-2 text-gray-300 hover:text-red-500 transition-colors ${field.isCore ? 'opacity-0' : ''}`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
              <Smartphone className="w-3 h-3" /> Mobile Preview
            </h3>
            
            <div className="bg-gray-200 dark:bg-gray-900 rounded-[2.5rem] p-3 border-4 border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden aspect-[9/16] max-h-[600px] flex flex-col mx-auto w-full max-w-[320px]">
              <div className="bg-white dark:bg-gray-800 h-full rounded-[1.8rem] flex flex-col shadow-inner overflow-hidden">
                {/* Simulated Modal Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="h-3 w-20 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                    <X className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="h-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full mt-2"></div>
                </div>

                {/* Simulated Form Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {visibleFields.map(f => (
                    <div key={f.id} className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
                       <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-gray-500 uppercase">{f.label}</span>
                         {f.required && <div className="h-1 w-1 bg-red-400 rounded-full"></div>}
                       </div>
                       <div className={`w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 ${f.type === 'textarea' ? 'h-16' : 'h-8'}`}></div>
                    </div>
                  ))}
                  {visibleFields.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 text-center">
                       <LayoutIcon className="w-12 h-12 mb-2" />
                       <p className="text-[10px] font-bold uppercase">No fields visible</p>
                    </div>
                  )}
                </div>

                {/* Simulated Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                   <div className="flex-1 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                   <div className="flex-1 h-9 bg-indigo-600 rounded-lg"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-center">
               <p className="text-[10px] text-indigo-600 dark:text-indigo-300 leading-relaxed italic">
                 Changes affect all users immediately upon saving.
               </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const ChevronUp = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);

export default LayoutBuilder;
