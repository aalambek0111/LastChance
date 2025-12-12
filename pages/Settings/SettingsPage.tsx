import React, { useState } from 'react';
import { Building, Globe, DollarSign, Upload, ImageIcon, Bell, Save, Check } from 'lucide-react';
import { useI18n } from '../../context/ThemeContext';

const SettingsPage: React.FC = () => {
   const [settings, setSettings] = useState({
      orgName: 'Wanderlust Tours',
      contactEmail: 'alex@wanderlust.com',
      timezone: 'UTC-5 (EST)',
      currency: 'USD ($)',
      emailLeads: true,
      emailBookings: true,
      whatsappAlerts: false
   });
   const [isLoading, setIsLoading] = useState(false);
   const { language, setLanguage, t } = useI18n();

   const handleSave = () => {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1000);
   };

   return (
      <div className="relative flex flex-col h-full bg-gray-50 dark:bg-gray-900 overflow-hidden">
         <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-8 pb-24">
               {/* Header */}
               <div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{t('page_settings_title')}</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your organization preferences and configurations.</p>
               </div>
               
               {/* Workspace Settings */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                           <Building className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Workspace Settings</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">General information about your company.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Organization Name</label>
                        <input 
                           type="text" 
                           value={settings.orgName}
                           onChange={(e) => setSettings({...settings, orgName: e.target.value})}
                           className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Shown on customer invoices and emails.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Contact Email</label>
                        <input 
                           type="email" 
                           value={settings.contactEmail}
                           onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                           className="w-full p-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                        />
                        <p className="mt-1.5 text-xs text-gray-500">Primary contact for system notifications.</p>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Default Timezone</label>
                        <div className="relative">
                           <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                           <select 
                              value={settings.timezone}
                              onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                           >
                              <option>UTC-8 (PST)</option>
                              <option>UTC-5 (EST)</option>
                              <option>UTC+0 (GMT)</option>
                              <option>UTC+1 (CET)</option>
                           </select>
                        </div>
                     </div>
                     <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Default Currency</label>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                           <select 
                              value={settings.currency}
                              onChange={(e) => setSettings({...settings, currency: e.target.value})}
                              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none"
                           >
                              <option>USD ($)</option>
                              <option>EUR (€)</option>
                              <option>GBP (£)</option>
                           </select>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Language & Region */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                   <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                             <Globe className="w-5 h-5" />
                          </div>
                          <div>
                             <h3 className="text-lg font-bold text-gray-900 dark:text-white">Language & Region</h3>
                             <p className="text-sm text-gray-500 dark:text-gray-400">Manage your language preferences.</p>
                          </div>
                       </div>
                    </div>
                    <div className="p-6">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Interface Language</label>
                        <div className="flex gap-3">
                            <button 
                              onClick={() => setLanguage('en')}
                              className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${language === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                <span className="text-lg">🇺🇸</span>
                                <span className="font-medium">English</span>
                                {language === 'en' && <Check className="w-4 h-4 ml-1" />}
                            </button>
                            <button 
                              onClick={() => setLanguage('ru')}
                              className={`flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-2 transition-all ${language === 'ru' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 ring-1 ring-indigo-500/20' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'}`}
                            >
                                <span className="text-lg">🇷🇺</span>
                                <span className="font-medium">Русский</span>
                                {language === 'ru' && <Check className="w-4 h-4 ml-1" />}
                            </button>
                        </div>
                    </div>
               </div>

               {/* Branding */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-50 dark:bg-pink-900/20 rounded-lg text-pink-600 dark:text-pink-400">
                           <ImageIcon className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Branding</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Customize the look and feel of your client communications.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="p-6 flex flex-col md:flex-row gap-8 items-start">
                     <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Company Logo</label>
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                           <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center text-indigo-500 mb-3 group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5" />
                           </div>
                           <p className="text-sm font-medium text-gray-900 dark:text-white">Click to upload logo</p>
                           <p className="text-xs text-gray-500 mt-1">SVG, PNG, or JPG (max 2MB)</p>
                        </div>
                     </div>
                     <div className="flex-1 w-full">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Primary Color</label>
                        <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50/50 dark:bg-gray-900/50">
                           <div className="w-12 h-12 rounded-full bg-indigo-600 shadow-sm ring-4 ring-white dark:ring-gray-800"></div>
                           <div>
                              <p className="font-mono text-sm font-medium text-gray-900 dark:text-white">#4F46E5</p>
                              <p className="text-xs text-gray-500 mt-0.5">Used for buttons and highlights.</p>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Notifications */}
               <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400">
                           <Bell className="w-5 h-5" />
                        </div>
                        <div>
                           <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400">Control when and how you receive alerts.</p>
                        </div>
                     </div>
                  </div>
                  
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                     <div className="p-4 sm:p-6 flex items-center justify-between">
                        <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">New Lead Alerts</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive an email when a new lead is created.</p>
                        </div>
                        <button 
                           onClick={() => setSettings({...settings, emailLeads: !settings.emailLeads})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.emailLeads ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                           <span className={`translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailLeads ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                     </div>

                     <div className="p-4 sm:p-6 flex items-center justify-between">
                        <div>
                           <p className="text-sm font-semibold text-gray-900 dark:text-white">Booking Confirmations</p>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Receive an email when a booking is confirmed.</p>
                        </div>
                        <button 
                           onClick={() => setSettings({...settings, emailBookings: !settings.emailBookings})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${settings.emailBookings ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                        >
                           <span className={`translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.emailBookings ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                     </div>

                     <div className="p-4 sm:p-6 flex items-center justify-between opacity-60">
                        <div>
                           <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">WhatsApp Alerts</p>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-600">SOON</span>
                           </div>
                           <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Get instant notifications via WhatsApp Business.</p>
                        </div>
                        <button 
                           disabled
                           className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                        >
                           <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-500 transition-transform" />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Sticky Footer */}
         <div className="sticky bottom-0 z-10 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 flex justify-end">
             <button 
               onClick={handleSave}
               className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
               disabled={isLoading}
            >
               {isLoading ? (
                  <>
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                     Saving...
                  </>
               ) : (
                  <>
                     <Save className="w-4 h-4" />
                     Save Changes
                  </>
               )}
            </button>
         </div>
      </div>
   );
};

export default SettingsPage;