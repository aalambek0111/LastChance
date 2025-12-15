
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, CheckCircle2, Star, ShieldCheck, Lock, CreditCard } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen h-screen flex overflow-hidden bg-white dark:bg-gray-900 transition-colors duration-300">
      
      {/* LEFT COLUMN: Form Area */}
      <div className="w-full lg:w-[55%] flex flex-col relative z-10 bg-white dark:bg-gray-900 transition-colors overflow-y-auto lg:overflow-hidden scrollbar-hide">
        
        {/* Theme Toggle */}
        <div className="absolute top-6 right-6 z-20">
          <button 
            onClick={toggleTheme}
            className="p-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        {/* Centered Form Container - Lifted visually with pb-12/32 */}
        <div className="flex-1 flex flex-col justify-center items-center px-6 sm:px-8 lg:px-12 xl:px-16 pt-10 pb-12 lg:pb-32">
          <div className="w-full max-w-[380px] space-y-8">
            
            {/* Header with Centered Logo */}
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3">
                <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
                <span className="font-bold text-2xl text-gray-900 dark:text-white tracking-tight">TourCRM</span>
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 text-base text-gray-500 dark:text-gray-400 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* The Form Content */}
            <div className="py-2">
              {children}
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                <div className="flex justify-center gap-4 sm:gap-6 text-[10px] sm:text-[11px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider flex-wrap">
                    <div className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Secure SSL</div>
                    <div className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> GDPR Ready</div>
                    <div className="flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" /> No Card Needed</div>
                </div>
            </div>

            {/* Footer Links */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Help Center</a>
              <span>&copy; {new Date().getFullYear()} TourCRM</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Branding / Marketing */}
      <div className="hidden lg:flex lg:w-[45%] relative bg-indigo-600 dark:bg-gray-800 text-white overflow-hidden flex-col justify-center items-center">
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-violet-700 dark:from-gray-900 dark:to-indigo-950 pointer-events-none">
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
           <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-[120px] mix-blend-screen"></div>
           <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] mix-blend-screen"></div>
        </div>

        {/* Content Container - No scroll, centered, scaled for smaller screens */}
        <div className="relative z-10 w-full max-w-lg flex flex-col gap-6 xl:gap-8 p-8 xl:p-12 lg:scale-[0.85] xl:scale-100 transition-transform duration-300 ease-out origin-center">
           
           {/* Top: Value Prop */}
           <div>
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-50 mb-6 shadow-sm">
                <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                <span>Enterprise Grade CRM</span>
             </div>
             <h1 className="text-3xl xl:text-5xl font-bold leading-tight mb-4 xl:mb-6 text-white tracking-tight">
               Turn leads into bookings faster.
             </h1>
             <ul className="space-y-3 xl:space-y-4">
               {[
                 'Capture leads from WhatsApp, website, and referrals',
                 'Track bookings, status, and assignments in one place',
                 'Manage your tour catalog and see simple revenue reports'
               ].map((item, i) => (
                 <li key={i} className="flex items-start gap-3 text-indigo-100/90 text-sm xl:text-base font-medium">
                   <div className="mt-1 p-0.5 bg-indigo-500/50 rounded-full">
                     <CheckCircle2 className="w-4 h-4 text-white" />
                   </div>
                   {item}
                 </li>
               ))}
             </ul>
           </div>

           {/* Middle: Mockup (Compact Stack) */}
           <div className="relative group perspective-1000 my-2">
              <div className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-6 transform rotate-1 group-hover:rotate-0 transition-all duration-700 ease-out">
                 {/* Fake Header */}
                 <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                    <div className="flex gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-400/90"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-400/90"></div>
                       <div className="w-3 h-3 rounded-full bg-green-400/90"></div>
                    </div>
                    <div className="h-2 w-24 bg-white/20 rounded-full"></div>
                 </div>
                 {/* Fake Chart */}
                 <div className="flex items-end justify-between h-28 xl:h-36 gap-3 mb-6 px-2">
                    {[35, 60, 45, 85, 55, 95, 75].map((h, i) => (
                       <div key={i} className="w-full bg-gradient-to-t from-indigo-300/50 to-indigo-200/20 rounded-t-sm relative overflow-hidden" style={{ height: `${h}%` }}>
                          <div className="absolute top-0 left-0 right-0 h-1 bg-white/40"></div>
                       </div>
                    ))}
                 </div>
                 {/* Fake Row Stats */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-lg bg-white/10"></div>
                       <div className="space-y-2 flex-1">
                          <div className="h-2.5 w-3/4 bg-white/30 rounded-full"></div>
                          <div className="h-2 w-1/2 bg-white/10 rounded-full"></div>
                       </div>
                       <div className="h-5 w-12 bg-green-400/30 rounded-full"></div>
                    </div>
                 </div>
              </div>
              
              {/* Decorative Blur Behind */}
              <div className="absolute -z-10 -right-8 -bottom-8 w-40 h-40 bg-purple-500/40 rounded-full blur-3xl"></div>
           </div>

           {/* Bottom: Testimonial Glass Card */}
           <div className="bg-black/20 backdrop-blur-md rounded-xl p-5 border border-white/10 shadow-xl">
             <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
             </div>
             <p className="text-sm xl:text-base font-medium leading-relaxed text-white/95 mb-4">
               "TourCRM completely streamlined our workflow. We save about 15 hours a week on admin tasks alone."
             </p>
             <div className="flex items-center gap-4">
                <img 
                   src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100" 
                   alt="Elena" 
                   className="w-10 h-10 rounded-full border-2 border-white/20"
                />
                <div>
                   <div className="font-bold text-sm text-white">Elena Rodriguez</div>
                   <div className="text-indigo-200 text-xs font-medium uppercase tracking-wide">CEO, Horizon Adventures</div>
                </div>
             </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
