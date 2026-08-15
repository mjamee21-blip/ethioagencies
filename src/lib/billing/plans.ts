export type PlanName = "STARTER" | "BUSINESS" | "PROFESSIONAL" | "ENTERPRISE";

export interface PlanDetails {
  name: PlanName;
  displayName: string;
  monthlyPriceUSD: number;
  limits: {
    users: number;
    workers: number;
    storageGB: number;
  };
  features: string[];
}

export const SAAS_PLANS: Record<PlanName, PlanDetails> = {
  STARTER: {
    name: "STARTER",
    displayName: "Starter Agency",
    monthlyPriceUSD: 49,
    limits: {
      users: 3,
      workers: 250,
      storageGB: 10,
    },
    features: ["Core CRM", "Passport OCR", "Basic Notifications", "Manual Integrations"],
  },
  BUSINESS: {
    name: "BUSINESS",
    displayName: "Growing Business",
    monthlyPriceUSD: 149,
    limits: {
      users: 10,
      workers: 1000,
      storageGB: 50,
    },
    features: ["Everything in Starter", "Agency AI Assistant", "WhatsApp Business API", "Priority Support"],
  },
  PROFESSIONAL: {
    name: "PROFESSIONAL",
    displayName: "Professional Agency",
    monthlyPriceUSD: 299,
    limits: {
      users: 25,
      workers: 5000,
      storageGB: 200,
    },
    features: ["Everything in Business", "Musaned & Visa Integrations", "Advanced Analytics", "Dedicated Account Manager"],
  },
  ENTERPRISE: {
    name: "ENTERPRISE",
    displayName: "Enterprise Network",
    monthlyPriceUSD: 599,
    limits: {
      users: 999,
      workers: 99999,
      storageGB: 1000,
    },
    features: ["Unlimited Users & Workers", "Custom Integrations", "SLA Guarantee", "On-Premises Option"],
  },
};
