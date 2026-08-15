import { MusanedIntegration } from "./musaned";
import { VisaIntegration } from "./visa";
import { MedicalIntegration } from "./medical";
import { WhatsAppIntegration } from "./whatsapp";
import { SMSIntegration } from "./sms";
import { PaymentsIntegration } from "./payments";
import { ExternalIntegration } from "./types";

export const integrationsRegistry: Record<string, ExternalIntegration> = {
  musaned: new MusanedIntegration(),
  visa: new VisaIntegration(),
  medical: new MedicalIntegration(),
  whatsapp: new WhatsAppIntegration(),
  sms: new SMSIntegration(),
  payments: new PaymentsIntegration(),
};

export function getIntegration(name: string): ExternalIntegration {
  const integration = integrationsRegistry[name];
  if (!integration) {
    throw new Error(`Integration provider not found: ${name}`);
  }
  return integration;
}
