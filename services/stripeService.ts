
// Mock Stripe Service
export const StripeService = {
  /**
   * Simulates creating a Stripe Checkout Session
   */
  createCheckoutSession: async (planId: string): Promise<void> => {
    return new Promise((resolve) => {
      console.log(`[Stripe] Creating checkout session for plan: ${planId}`);
      
      // Simulate network delay
      setTimeout(() => {
        const mockUrl = `https://checkout.stripe.com/pay/${planId}_test_session_id`;
        
        // In a real app, you would redirect here:
        // window.location.href = response.url;
        
        console.log(`[Stripe] Redirecting to: ${mockUrl}`);
        alert(`Redirecting to Stripe Checkout for ${planId.toUpperCase()} plan...\n\n(This is a test mode simulation)`);
        resolve();
      }, 1000);
    });
  },

  /**
   * Simulates opening the Stripe Billing Portal
   */
  createPortalSession: async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        alert('Redirecting to Stripe Customer Portal to manage billing...');
        resolve();
      }, 800);
    });
  }
};
