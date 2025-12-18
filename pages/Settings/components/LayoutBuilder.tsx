import React, { useState, useMemo } from 'react';
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Settings2, 
  Plus, 
  Trash2, 
  Layout as LayoutIcon,
  CheckCircle2,
  Info,
  Smartphone,
  MousePointer2,
  Lock,
  X
} from 'lucide-react';

type FieldType = 'text' | 'number' | 'date' | 'select' | 'email' | 'phone' | 'textarea';

interface LayoutField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  visible: boolean;
  isCore?: boolean; // Core fields can't be deleted, only hidden
}

type ObjectType = 'Leads' | 'Bookings' | 'Tours';

const DEFAULT_LAYOUTS: Record<ObjectType, LayoutField[]> = {
  Leads: [
    { id: 'name', label: 'Full Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 'email', label: 'Email Address', type: 'email', required: true, visible: true, isCore: true },
    { id: 'phone', label: 'Phone Number', type: 'phone', required: false, visible: true, isCore: true },
    { id: 'company', label: 'Company / Organization', type: 'text', required: false, visible: true },
    { id: 'channel', label: 'Lead Source', type: 'select', required: false, visible: true },
    { id: 'value', label: 'Estimated Deal Value', type: 'number', required: false, visible: true },
    { id: 'notes', label: 'Internal Notes', type: 'textarea', required: false, visible: true },
  ],
  Bookings: [
    { id: 'client', label: 'Client Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 'tour', label: 'Tour Selection', type: 'select', required: true, visible: true, isCore: true },
    { id: 'date', label: 'Booking Date', type: 'date', required: true, visible: true, isCore: true },
    { id: 'pax', label: 'Number of Guests', type: 'number', required: true, visible: true },
    { id: 'pickup', label: 'Pickup Location', type: 'text', required: false, visible: true },
    { id: 'payment', label: 'Payment Status', type: 'select', required: false, visible: true },
    { id: 'guide', label: 'Assigned Guide', type: 'select', required: false, visible: true },
  ],
  Tours: [
    { id: 't_name', label: 'Tour Name', type: 'text', required: true, visible: true, isCore: true },
    { id: 't_price', label: 'Base Price', type: 'number', required: true, visible: true, isCore: true },
    { id: 't_duration', label: 'Duration', type: 'text', required: false, visible: true },
    { id: 't_capacity', label: 'Max Capacity', type: 'number', required: false, visible: true },
    { id: 't_diff', label: 'Difficulty Level', type: 'select', required: false, visible: true },
    { id: 't_desc', label: 'Public Description', type: 'textarea', required: false, visible: true },
  ]
};

const LayoutBuilder: React.FC = () => {
  const [activeObject, setActiveObject] = useState<ObjectType>('Leads');
  const [layouts, setLayouts] = useState<Record<ObjectType, LayoutField[]>>(DEFAULT_LAYOUTS);
  const [isSaving, setIsSaving] = useState(false);

  const activeLayout = layouts[activeObject];
  const visibleFields = activeLayout.filter(f => f.visible);
  const hiddenFields = activeLayout.filter(f => !f.visible);

  const toggleVisibility = (fieldId: string) => {
    setLayouts(prev => ({
      ...prev,
      [activeObject]: prev[activeObject].map(f => 
        f.id === fieldId ? { ...f, visible: !f.visible } : f
      )
    }));
  };

  const toggleRequired = (fieldId: string) => {
    setLayouts(prev => ({
      ...prev,
      [activeObject]: prev[activeObject].map(f => 
        f.id === fieldId ? { ...f, required: !f.required } : f
      )
    }));
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const newArr = [...activeLayout];
    [newArr[idx - 1], newArr[idx]] = [newArr[idx], newArr[idx - 1]];
    setLayouts(prev => ({ ...prev, [activeObject]: newArr }));
  };

  const moveDown = (idx: number) => {
    if (idx === activeLayout.length - 1) return;
    const newArr = [...activeLayout];
    [newArr[idx + 1], newArr[idx]] = [newArr[idx], newArr[idx + 1]];
    setLayouts(prev => ({ ...prev, [activeObject]: newArr }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Editor (8 Cols) */}
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
                     <button onClick={() => moveUp(idx)} className="text-gray-400 hover:text-indigo-500"><ChevronUp className="w-3 h-3"/></button>
                     <button onClick={() => moveDown(idx)} className="text-gray-400 hover:text-indigo-500"><ChevronDown className="w-3 h-3"/></button>
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
                      onClick={() => toggleRequired(field.id)}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${field.required ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      title="Mandatory Field"
                    >
                      <Lock className={`w-3 h-3 ${field.required ? '' : 'opacity-30'}`} />
                      Req
                    </button>

                    {/* Visibility Toggle */}
                    <button 
                      onClick={() => toggleVisibility(field.id)}
                      className={`p-2 rounded-lg transition-all ${field.visible ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                      title={field.visible ? "Hide field" : "Show field"}
                    >
                      {field.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    
                    <button className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview (4 Cols) */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-2">
              <Smartphone className="w-3 h-3" /> Visual Preview
            </h3>
            
            <div className="bg-gray-200 dark:bg-gray-900 rounded-[2.5rem] p-3 border-4 border-gray-300 dark:border-gray-800 shadow-2xl overflow-hidden aspect-[9/16] max-h-[600px] flex flex-col mx-auto">
              <div className="bg-white dark:bg-gray-800 h-full rounded-[1.8rem] flex flex-col shadow-inner overflow-hidden">
                {/* Simulated Modal Header */}
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 shrink-0">
                  <div className="flex justify-between items-center mb-1">
                    <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    {/* Fix: Added missing X icon to the imports */}
                    <X className="w-4 h-4 text-gray-300" />
                  </div>
                  <div className="h-5 w-40 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                </div>

                {/* Simulated Form Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
                  {visibleFields.map(f => (
                    <div key={f.id} className="space-y-1.5 animate-in fade-in slide-in-from-bottom-1">
                       <div className="flex items-center justify-between">
                         <div className="h-2 w-24 bg-gray-100 dark:bg-gray-700 rounded-full"></div>
                         {f.required && <div className="h-1.5 w-1.5 bg-red-400 rounded-full"></div>}
                       </div>
                       <div className={`w-full rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 ${f.type === 'textarea' ? 'h-16' : 'h-9'}`}></div>
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
                <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-2">
                   <div className="flex-1 h-9 bg-gray-100 dark:bg-gray-700 rounded-lg"></div>
                   <div className="flex-1 h-9 bg-indigo-600 rounded-lg"></div>
                </div>
              </div>
            </div>
            
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
               <p className="text-[10px] text-indigo-600 dark:text-indigo-300 leading-relaxed italic">
                 <b>Tip:</b> Required fields are marked with an asterisk in the real UI and prevent form submission if empty.
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