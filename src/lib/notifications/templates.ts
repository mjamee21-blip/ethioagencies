export const NOTIFICATION_TEMPLATES = {
  MEDICAL_COMPLETED: {
    subject: "Medical Processing Completed - Recruitment Agency OS",
    body: "Dear {{client_name}}, your worker {{worker_name}} has completed medical processing successfully.",
  },
  VISA_APPROVED: {
    subject: "Visa Approved - Recruitment Agency OS",
    body: "Dear {{client_name}}, the employment visa for worker {{worker_name}} (Visa No: {{visa_number}}) has been approved.",
  },
  TRAVEL_BOOKED: {
    subject: "Flight & Travel Booked - Recruitment Agency OS",
    body: "Dear {{client_name}}, travel arrangements have been confirmed for worker {{worker_name}}. Flight {{flight_number}} departing on {{departure_time}}.",
  },
  PAYMENT_RECEIVED: {
    subject: "Payment Received - Recruitment Agency OS",
    body: "Dear {{client_name}}, we have received your payment of {{amount}} {{currency}} for invoice {{invoice_number}}. Thank you!",
  },
};

export function renderTemplate(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  data: Record<string, string>
): { subject: string; body: string } {
  const template = NOTIFICATION_TEMPLATES[templateKey];
  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  let subject = template.subject;
  let body = template.body;

  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value || "");
    body = body.replace(regex, value || "");
  }

  return { subject, body };
}
