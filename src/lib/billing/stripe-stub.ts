export interface StripeCheckoutSessionOptions {
  agencyId: number;
  planName: string;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeCheckoutResult {
  sessionId: string;
  checkoutUrl: string;
}

export class StripeBillingStub {
  async createCheckoutSession(options: StripeCheckoutSessionOptions): Promise<StripeCheckoutResult> {
    // Simulate Stripe Checkout Session creation
    await new Promise((resolve) => setTimeout(resolve, 400));
    const sessionId = `cs_test_${Math.random().toString(36).substring(2, 14)}`;
    return {
      sessionId,
      checkoutUrl: `/api/billing/webhook-stub?session_id=${sessionId}&agency_id=${options.agencyId}&plan=${options.planName}`,
    };
  }

  async handleWebhookEvent(event: { type: string; data: any }): Promise<{ success: boolean; message: string }> {
    // Simulate processing Stripe webhook
    return {
      success: true,
      message: `Processed Stripe event: ${event.type}`,
    };
  }
}

export const stripeStub = new StripeBillingStub();
