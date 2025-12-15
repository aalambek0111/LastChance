import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle, 
  ChevronRight, 
  Download, 
  Trash2,
  Database,
  Link,
  RefreshCw,
  File,
  ArrowLeftRight,
  HelpCircle
} from 'lucide-react';

// --- Types & Config ---

type ImportStep = 1 | 2 | 3 | 4 | 5;
type ImportObject = 'leads' | 'bookings' | 'tours';
type ImportMode = 'create' | 'upsert';

interface CrmField {
  key: string;
  label: string;
  required?: boolean;
  type: 'text' | 'number' | 'date' | 'select' | 'email' | 'phone';
  options?: string[]; // for select types
  description?: string;
}

const CRM_SCHEMA: Record<ImportObject, CrmField[]> = {
  leads: [
    { key: 'name', label: 'Full Name', required: true, type: 'text' },
    { key: 'email', label: 'Email', required: true, type: 'email' },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'channel', label: 'Channel', type: 'select', options: ['Website', 'Referral', 'Social', 'WhatsApp', 'Email'] },
    { key: 'status', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Booked', 'Lost'] },
    { key: 'notes', label: 'Notes', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'value', label: 'Deal Value', type: 'number' },
  ],
  bookings: [
    { key: 'clientName', label: 'Client Name', required: true, type: 'text' },
    { key: 'tourName', label: 'Tour Name', required: true, type: 'text', description: 'Must match an existing tour' },
    { key: 'date', label: 'Date', required: true, type: 'date' },
    { key: 'pax', label: 'Pax', required: true, type: 'number' },
    { key: 'status', label: 'Status', type: 'select', options: ['Confirmed', 'Pending', 'Cancelled', 'Completed'] },
    { key: 'amount', label: 'Total Amount', type: 'number' },
    { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Paid', 'Unpaid', 'Partially Paid', 'Refunded'] },
  ],
  tours: [
    { key: 'name', label: 'Tour Name', required: true, type: 'text' },
    { key: 'price', label: 'Price', required: true, type: 'number' },
    { key: 'duration', label: 'Duration', type: 'text' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['Easy', 'Moderate', 'Hard', 'Expert'] },
    { key: 'active', label: 'Active', type: 'select', options: ['true', 'false'] },
    { key: 'maxPeople', label: 'Max People', type: 'number' },
    { key: 'location', label: 'Location', type: 'text' },
  ]
};

// --- Mock CSV Parser (Simple implementation for demo) ---
// In production, use PapaParse
const parseCSV = (content: string): { headers: string[], data: Record<string, string>[] } => {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], data: [] };
  
  // Simple CSV split (doesn't handle commas inside quotes perfectly, but good for demo)
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data = lines.slice(1).map(line => {
    // Handle quotes roughly
    const values: string[] = [];
    let inQuote = false;
    let current = '';
    for(let i = 0; i < line.length; i++) {
        const char = line[i];
        if(char === '"') { inQuote = !inQuote; continue; }
        if(char === ',' && !inQuote) { values.push(current.trim()); current = ''; continue; }
        current += char;
    }
    values.push(current.trim());

    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || '';
    });
    return row;
  });
  return { headers, data };
};

// --- Main Component ---

const ImportPage: React.FC = () => {
  // Wizard State
  const [step, setStep] = useState<ImportStep>(1);
  const [objectType, setObjectType] = useState<ImportObject>('leads');
  const [mode, setMode] = useState<ImportMode>('create');
  const [matchKey, setMatchKey] = useState('email'); // Default for leads

  // File State
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Mapping State
  // Map CRM Field Key (key) -> CSV Header (value)
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});

  // Validation State
  const [validationResults, setValidationResults] = useState<{
    validCount: number;
    errorCount: number;
    rows: { data: any, errors: string[], warnings: string[] }[];
  } | null>(null);

  // Import Execution State
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  // --- Helpers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setIsProcessingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const target = event.target as FileReader;
      const text = target?.result as string;
      // Simulate delay for realism
      setTimeout(() => {
        const { headers, data } = parseCSV(text);
        setCsvHeaders(headers);
        setCsvData(data);
        
        // Auto-Map Logic: Try to match CSV Headers to CRM Fields
        const newMapping: Record<string, string> = {};
        const crmFields = CRM_SCHEMA[objectType];
        
        crmFields.forEach(field => {
          const normFieldLabel = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');
          const normFieldKey = field.key.toLowerCase().replace(/[^a-z0-9]/g, '');
          
          // Find best match in CSV headers
          const match = headers.find(h => {
            const normHeader = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return normHeader === normFieldLabel || normHeader === normFieldKey;
          });
          
          if (match) {
            newMapping[field.key] = match;
          }
        });
        
        setFieldMapping(newMapping);
        setIsProcessingFile(false);
      }, 800);
    };
    reader.readAsText(uploadedFile);
  };

  const runValidation = () => {
    const schema = CRM_SCHEMA[objectType];
    const results = csvData.slice(0, 50).map((row: Record<string, string>) => { // Validate first 50 for preview
      const mappedRow: Record<string, string | undefined> = {};
      const errors: string[] = [];
      const warnings: string[] = [];

      // Construct mapped object based on fieldMapping (CRM Key -> CSV Header)
      Object.entries(fieldMapping).forEach(([crmKey, csvHeader]) => {
        if (csvHeader && typeof csvHeader === 'string') {
            mappedRow[crmKey] = row[csvHeader];
        }
      });

      // Validate against Schema
      schema.forEach(field => {
        const value = mappedRow[field.key];

        // 1. Required Check
        if (field.required && (!value || value.trim() === '')) {
          errors.push(`${field.label} is required.`);
        }

        if (value) {
          // 2. Type Checks
          if (field.type === 'number') {
            if (isNaN(Number(value))) errors.push(`${field.label} must be a number.`);
          }
          if (field.type === 'date') {
            if (isNaN(Date.parse(value))) errors.push(`${field.label} invalid date format.`);
          }
          if (field.type === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) errors.push(`Invalid email format.`);
          }
          
          // 3. Select Options Check
          if (field.type === 'select' && field.options) {
            // Case-insensitive match check
            const match = field.options.some(opt => opt.toLowerCase() === value.toLowerCase());
            if (!match) {
              warnings.push(`"${value}" not in list for ${field.label}.`);
            }
          }
        }
      });

      return { data: mappedRow, errors, warnings };
    });

    const errorCount = results.filter(r => r.errors.length > 0).length;
    const validCount = results.length - errorCount;

    setValidationResults({ rows: results, errorCount, validCount });
    setStep(4);
  };

  const executeImport = () => {
    setStep(5);
    setImportStatus('running');
    
    // Simulate Progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setImportStatus('completed');
      }
      setImportProgress(progress);
    }, 300);
  };

  // --- Render Steps ---

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 dark:bg-gray-700 z-0"></div>
        {[
          { num: 1, label: 'Configure' },
          { num: 2, label: 'Upload' },
          { num: 3, label: 'Map Fields' },
          { num: 4, label: 'Validate' },
          { num: 5, label: 'Import' }
        ].map((s) => {
          const isCompleted = step > s.num;
          const isCurrent = step === s.num;
          return (
            <div key={s.num} className="relative z-10 flex flex-col items-center gap-2 bg-gray-50 dark:bg-gray-900 px-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                isCompleted ? 'bg-green-500 text-white' : 
                isCurrent ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900' : 
                'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : s.num}
              </div>
              <span className={`text-xs font-medium ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Data</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Bulk upload leads, bookings, or tours from CSV.</p>
      </div>

      {renderStepIndicator()}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[400px] flex flex-col">
        
        {/* --- STEP 1: CONFIGURE --- */}
        {step === 1 && (
          <div className="p-8 max-w-2xl mx-auto w-full space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                What do you want to import?
              </label>
              <div className="grid grid-cols-3 gap-4">
                {(['leads', 'bookings', 'tours'] as ImportObject[]).map(obj => (
                  <button
                    key={obj}
                    onClick={() => { setObjectType(obj); setMatchKey(obj === 'leads' ? 'email' : 'name'); }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      objectType === obj 
                        ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-600' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold capitalize text-gray-900 dark:text-white">{obj}</div>
                    <div className="text-xs text-gray-500 mt-1">CSV supported</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
                Import Mode
              </label>
              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${mode === 'create' ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input type="radio" name="mode" className="mt-1" checked={mode === 'create'} onChange={() => setMode('create')} />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Create New Records</div>
                    <div className="text-xs text-gray-500">Adds all rows as new entries. Duplicates may be created.</div>
                  </div>
                </label>
                
                <label className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${mode === 'upsert' ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input type="radio" name="mode" className="mt-1" checked={mode === 'upsert'} onChange={() => setMode('upsert')} />
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">Update Existing (Upsert)</div>
                    <div className="text-xs text-gray-500">Updates records if they exist, creates them if they don't.</div>
                  </div>
                </label>
              </div>
            </div>

            {mode === 'upsert' && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2">
                  Match records by
                </label>
                <select 
                  value={matchKey} 
                  onChange={(e) => setMatchKey(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  {CRM_SCHEMA[objectType].map(f => (
                    <option key={f.key} value={f.key}>{f.label} ({f.key})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setStep(2)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: UPLOAD --- */}
        {step === 2 && (
          <div className="p-8 flex flex-col items-center justify-center h-full space-y-6 animate-in fade-in slide-in-from-right-8">
            <div className="w-full max-w-xl border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-10 flex flex-col items-center text-center bg-gray-50/50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer relative">
              <input 
                type="file" 
                accept=".csv" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleFileUpload}
              />
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Click to upload or drag & drop</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">CSV files only. Max 5MB.</p>
            </div>

            {isProcessingFile && (
              <div className="flex items-center gap-3 text-indigo-600">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span className="font-medium">Processing file...</span>
              </div>
            )}

            {file && !isProcessingFile && (
              <div className="w-full max-w-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button onClick={() => { setFile(null); setCsvData([]); }} className="text-red-500 hover:bg-red-50 p-2 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-between w-full max-w-xl pt-4">
              <button onClick={() => setStep(1)} className="text-gray-500 hover:text-gray-900 font-medium">Back</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!file}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center gap-2"
              >
                Next: Map Fields <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 3: MAPPING (REFACTORED) --- */}
        {step === 3 && (
          <div className="flex flex-col h-full animate-in fade-in">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Map Columns</h2>
                <p className="text-sm text-gray-500">Map your {objectType} fields (left) to the CSV columns (right).</p>
              </div>
              <div className="text-sm text-gray-500">
                <span className="font-semibold text-indigo-600">{Object.keys(fieldMapping).length}</span> of {CRM_SCHEMA[objectType].length} fields mapped
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-separate border-spacing-y-3">
                <thead>
                  <tr className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 pb-2 w-1/3">CRM Field (Target)</th>
                    <th className="px-4 pb-2 text-center w-12"></th>
                    <th className="px-4 pb-2 w-1/3">CSV Column (Source)</th>
                    <th className="px-4 pb-2 w-1/3">Sample Data</th>
                  </tr>
                </thead>
                <tbody>
                  {CRM_SCHEMA[objectType].map((field) => {
                    const selectedHeader = fieldMapping[field.key] || '';
                    const sampleValue = selectedHeader && csvData.length > 0 ? csvData[0][selectedHeader] : '-';
                    const isMapped = !!selectedHeader;

                    return (
                      <tr key={field.key} className={`bg-white dark:bg-gray-800 shadow-sm rounded-lg group ${isMapped ? 'border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}>
                        {/* CRM Field (Fixed) */}
                        <td className="px-4 py-3 border-y border-r border-gray-200 dark:border-gray-700 rounded-l-lg font-medium text-gray-900 dark:text-white align-middle">
                          <div className="flex flex-col">
                            <span className="flex items-center gap-1.5">
                              {field.label}
                              {field.required && <span className="text-red-500 text-xs font-bold" title="Required">*</span>}
                              {field.description && (
                                <span title={field.description} className="cursor-help flex items-center">
                                  <HelpCircle className="w-3 h-3 text-gray-400" />
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">{field.key}</span>
                          </div>
                        </td>

                        {/* Icon */}
                        <td className="px-2 py-3 border-y border-gray-200 dark:border-gray-700 text-center align-middle">
                          <ArrowLeftRight className={`w-4 h-4 mx-auto ${isMapped ? 'text-indigo-500' : 'text-gray-300 dark:text-gray-600'}`} />
                        </td>

                        {/* CSV Column (Dropdown) */}
                        <td className="px-4 py-3 border-y border-l border-gray-200 dark:border-gray-700 align-middle">
                          <select 
                            value={selectedHeader}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFieldMapping(prev => {
                                    const next = { ...prev };
                                    if (val) next[field.key] = val;
                                    else delete next[field.key];
                                    return next;
                                });
                            }}
                            className={`w-full p-2.5 rounded-lg border text-sm transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500 ${
                              isMapped
                                ? 'border-indigo-300 bg-indigo-50 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700' 
                                : 'border-gray-300 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                            }`}
                          >
                            <option value="">-- Select Column --</option>
                            {csvHeaders.map(h => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                        </td>

                        {/* Sample Data Preview */}
                        <td className="px-4 py-3 border-y border-l border-gray-200 dark:border-gray-700 rounded-r-lg align-middle">
                           <div className={`text-sm font-mono truncate max-w-xs px-2 py-1 rounded ${isMapped ? 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300' : 'text-gray-400 italic'}`}>
                              {sampleValue}
                           </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:text-gray-900 font-medium">Back</button>
              <button 
                onClick={runValidation}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2"
              >
                Validate Data <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 4: VALIDATION --- */}
        {step === 4 && validationResults && (
          <div className="flex flex-col h-full animate-in fade-in">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Validation Preview</h2>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {validationResults.validCount} Valid
                  </span>
                  <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full ${validationResults.errorCount > 0 ? 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'}`}>
                    <AlertCircle className="w-3.5 h-3.5" /> {validationResults.errorCount} Errors
                  </span>
                </div>
              </div>
              {validationResults.errorCount > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800 dark:text-red-200">
                    <p className="font-semibold">Issues found in your data.</p>
                    <p>Rows with errors will be skipped during import. You can fix the CSV and re-upload, or proceed to import only valid rows.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Row</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                    {/* Show only mapped CRM columns */}
                    {Object.keys(fieldMapping).map(key => {
                        const field = CRM_SCHEMA[objectType].find(f => f.key === key);
                        return (
                            <th key={key} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                                {field?.label || key}
                            </th>
                        );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {validationResults.rows.map((row, idx) => (
                    <tr key={idx} className={row.errors.length > 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <td className="px-4 py-3 text-xs text-gray-500 font-mono">{idx + 1}</td>
                      <td className="px-4 py-3">
                        {row.errors.length > 0 ? (
                          <div className="group relative">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 cursor-help">
                              Error
                            </span>
                            <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg hidden group-hover:block z-20">
                              {row.errors.join(', ')}
                            </div>
                          </div>
                        ) : row.warnings.length > 0 ? (
                          <div className="group relative">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 cursor-help">
                              Warning
                            </span>
                            <div className="absolute left-0 top-full mt-1 w-48 bg-gray-900 text-white text-xs p-2 rounded shadow-lg hidden group-hover:block z-20">
                              {row.warnings.join(', ')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 text-xs font-medium">Valid</span>
                        )}
                      </td>
                      {Object.keys(fieldMapping).map((key, i) => (
                        <td key={i} className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                          {row.data[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-between">
              <button onClick={() => setStep(3)} className="text-gray-500 hover:text-gray-900 font-medium">Back</button>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 font-medium">
                  Download Errors
                </button>
                <button 
                  onClick={executeImport}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/30"
                >
                  Start {mode === 'create' ? 'Import' : 'Upsert'} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- STEP 5: IMPORTING --- */}
        {step === 5 && (
          <div className="p-12 flex flex-col items-center justify-center h-full text-center space-y-8 animate-in zoom-in-95">
            {importStatus === 'running' ? (
              <>
                <div className="w-20 h-20 relative">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Importing Data...</h3>
                  <p className="text-gray-500">Please do not close this window.</p>
                </div>
                <div className="w-full max-w-md bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                  <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }}></div>
                </div>
                <p className="text-sm font-mono text-gray-400">{importProgress}%</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center animate-in bounce-in">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Import Complete!</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Your data has been successfully imported into TourCRM. 
                    <br/>You can view the new records in the {objectType} page.
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 w-full max-w-lg mt-8">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-green-600">{validationResults?.validCount}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                      {mode === 'create' ? 'Created' : 'Processed'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Updated</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="text-2xl font-bold text-red-500">{validationResults?.errorCount}</div>
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Failed</div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                    Import Another
                  </button>
                  <button className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-lg">
                    View {objectType}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ImportPage;