
import React, { useState } from 'react';
import { 
  Check, 
  X, 
  ArrowLeft, 
  Zap, 
  Shield, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp,
  CreditCard
} from 'lucide-react';
import { StripeService } from '../../services/stripeService';

interface UpgradePageProps {
  onBack: () => void;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '€0',
    interval: '/mo',
    description: 'Perfect for solo operators just getting started.',
    features: [
      '1 User Seat',
      'Up to 50 Bookings/mo',
      'Basic CRM Features',
      'Standard Support',
      '1GB Storage'
    ],
    limits: {
      automations: false,
      emailTemplates: false,
      reports: 'Basic'
    },
    cta: 'Current Plan',
    popular: false,
    highlight: false
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€29',
    interval: '/mo',
    description: 'For growing agencies that need automation.',
    features: [
      '5 User Seats',
      'Up to 500 Bookings/mo',
      'Workflow Automations',
      'Email Templates',
      '10GB Storage',
      'Priority Email Support'
    ],
    limits: {
      automations: true,
      emailTemplates: true,
      reports: 'Advanced'
    },
    cta: 'Upgrade to Pro',
    popular: true,
    highlight: true
  },
  {
    id: 'team',
    name: 'Team',
    price: '€79',
    interval: '/mo',
    description: 'Scale your operations with advanced controls.',
    features: [
      'Unlimited Seats',
      'Unlimited Bookings',
      'Advanced Reporting',
      'Dedicated Account Manager',
      '1TB Storage',
      'API Access'
    ],
    limits: {
      automations: true,
      emailTemplates: true,
      reports: 'Custom'
    },
    cta: 'Upgrade to Team',
    popular: false,
    highlight: false
  }
];

const FAQS = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time. Your access will continue until the end of your billing period.'
  },
  {
    q: 'Do you offer a trial for paid plans?',
    a: 'We offer a 14-day free trial for the Pro plan so you can explore the automation features risk-free.'
  },
  {
    q: 'How are invoices handled?',
    a: 'Invoices are automatically generated and emailed to the billing contact at the start of each billing cycle. You can also download them from the Settings page.'
  },
  {
    q: 'Is VAT included in the price?',
    a: 'Prices exclude VAT. VAT will be calculated during checkout based on your billing location.'
  }
];

const UpgradePage: React.FC<UpgradePageProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleUpgrade = async (planId: string) => {
    if (planId === 'starter') return;
    
    setIsLoading(planId);
    try {
      await StripeService.createCheckoutSession(planId);
    } catch (error) {
      console.error(error);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 overflow-y-auto">
      {/* Header */}
      <div className="bg-indigo-600 dark:bg-indigo-900 pt-8 pb-32 px-6">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-100 hover:text-white transition-colors mb-8 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </button>
          
          <div className="text-center text-white space-y-4 max-w-2xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold">Upgrade your workspace</h1>
            <p className="text-indigo-100 text-lg">
              Unlock the full potential of TourCRM with automation, advanced reporting, and more seats for your team.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-20">
        
        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map((plan) => (
            <div 
              key={plan.id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl flex flex-col ${
                plan.highlight 
                  ? 'border-2 border-indigo-500 ring-4 ring-indigo-500/10 z-10 scale-105 md:scale-110' 
                  : 'border border-gray-200 dark:border-gray-700 mt-0 md:mt-8'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md uppercase tracking-wider">
                  Most Popular
                </div>
              )}

              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.interval}</span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 min-h-[40px]">
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                      <div className="mt-0.5 p-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                        <Check className="w-3 h-3" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.id === 'starter' || !!isLoading}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all shadow-sm active:scale-95 ${
                    plan.highlight
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
                      : plan.id === 'starter' 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-default'
                        : 'bg-white dark:bg-gray-700 border-2 border-indigo-100 dark:border-gray-600 text-indigo-600 dark:text-indigo-300 hover:border-indigo-200 hover:bg-indigo-50 dark:hover:bg-gray-600'
                  }`}
                >
                  {isLoading === plan.id ? 'Processing...' : plan.cta}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mb-16">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Feature Comparison</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="p-4 text-sm font-semibold text-gray-500 dark:text-gray-400 w-1/3">Features</th>
                  {PLANS.map(p => (
                    <th key={p.id} className="p-4 text-sm font-bold text-gray-900 dark:text-white text-center w-1/5">{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {[
                  { label: 'Seats', k: 'seats', vals: ['1', '5', 'Unlimited'] },
                  { label: 'Bookings/mo', k: 'bookings', vals: ['50', '500', 'Unlimited'] },
                  { label: 'Automations', k: 'automations', vals: [false, true, true] },
                  { label: 'Email Templates', k: 'templates', vals: [false, true, true] },
                  { label: 'Reporting', k: 'reports', vals: ['Basic', 'Advanced', 'Custom'] },
                  { label: 'API Access', k: 'api', vals: [false, false, true] },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-4 text-sm font-medium text-gray-700 dark:text-gray-300">{row.label}</td>
                    {row.vals.map((val, i) => (
                      <td key={i} className="p-4 text-center">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <div className="flex justify-center"><Check className="w-5 h-5 text-green-500" /></div>
                          ) : (
                            <div className="flex justify-center"><X className="w-5 h-5 text-gray-300 dark:text-gray-600" /></div>
                          )
                        ) : (
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">{val}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">Frequently Asked Questions</h3>
          
          <div className="space-y-4">
            {FAQS.map((faq, i) => (
              <div 
                key={i} 
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <span className="font-semibold text-gray-900 dark:text-white">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
            <button className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center justify-center gap-2 mx-auto">
              <HelpCircle className="w-4 h-4" /> Contact our sales team
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default UpgradePage;
