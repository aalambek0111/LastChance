
import React from 'react';
import { CreditCard, Check, Zap, Download, Users, MessageSquare, Database } from 'lucide-react';

interface BillingSettingsProps {
  settings: any;
  onChange: (key: string, value: any) => void;
  onNavigate?: (page: string) => void;
}

const BillingSettings: React.FC<BillingSettingsProps> = ({ settings, onChange, onNavigate }) => {
  
  const handleDownloadInvoice = (invoice: { id: string, date: string, amount: string }) => {
    // Mock PDF generation - creates a text file for the MVP
    const content = `INVOICE ${invoice.id}
Date: ${invoice.date}
Amount: ${invoice.amount}
Status: Paid

----------------------------------------
Billed To:
${settings.orgName || 'Organization Name'}
${settings.billingEmail || 'billing@example.com'}

Item                  Amount
----------------------------------------
Pro Plan (Monthly)    ${invoice.amount}
----------------------------------------
Total                 ${invoice.amount}

Thank you for your business!
TourCRM`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${invoice.id}.txt`; // In a real app, this would be .pdf
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Plan Status */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/20 dark:to-gray-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Professional Plan</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase">
                Trial
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your 14-day trial expires in <span className="font-bold text-amber-600 dark:text-amber-400">12 days</span>.
            </p>
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('upgrade')}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Zap className="w-4 h-4 fill-current" />
            Upgrade Now
          </button>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Team Members</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">4</span>
              <span className="text-sm text-gray-500 mb-1">/ 10 seats</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-500 h-full w-[40%]"></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Storage</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">1.2</span>
              <span className="text-sm text-gray-500 mb-1">GB / 5 GB</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[24%]"></div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Emails Sent</div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">845</span>
              <span className="text-sm text-gray-500 mb-1">/ 2,000 mo</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full w-[42%]"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Method & Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Billing Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Billing Email</label>
              <input 
                type="email"
                value={settings.billingEmail || ''}
                onChange={(e) => onChange('billingEmail', e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                placeholder="billing@company.com"
              />
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                    <CreditCard className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No card added</p>
                    <p className="text-xs text-gray-500">Add a payment method to upgrade.</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline">Add</button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Invoices</h3>
          <div className="space-y-2">
            {[
              { id: 'INV-001', date: 'Oct 01, 2023', amount: '$0.00', status: 'Paid' },
            ].map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{inv.id}</p>
                    <p className="text-xs text-gray-500">{inv.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{inv.amount}</span>
                  <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">{inv.status}</span>
                  <button 
                    onClick={() => handleDownloadInvoice(inv)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Download Invoice"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-2 text-center">
              <p className="text-xs text-gray-400 italic">No previous invoices found.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Quick icon fix
const FileText = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);

export default BillingSettings;
