export interface SendNotificationOptions {
  to: string; // phone number or email address
  subject?: string; // for email
  templateName?: string;
  templateData?: Record<string, string>;
  message?: string;
  channel: "whatsapp" | "sms" | "email";
}

export interface NotificationSendResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface NotificationProvider {
  send(options: SendNotificationOptions): Promise<NotificationSendResult>;
}

export class WhatsAppBusinessProvider implements NotificationProvider {
  async send(options: SendNotificationOptions): Promise<NotificationSendResult> {
    // Simulate WhatsApp Cloud API call
    await new Promise((resolve) => setTimeout(resolve, 300));
    console.log(`[WhatsApp Business API] Sending to ${options.to}:`, options.message || options.templateName);
    return {
      success: true,
      messageId: `wa_msg_${Math.random().toString(36).substring(2, 10)}`,
      provider: "whatsapp_business",
    };
  }
}

export class SMSProvider implements NotificationProvider {
  async send(options: SendNotificationOptions): Promise<NotificationSendResult> {
    // Simulate SMS Gateway call (e.g. Twilio / Africa's Talking)
    await new Promise((resolve) => setTimeout(resolve, 250));
    console.log(`[SMS Gateway] Sending to ${options.to}:`, options.message || options.templateName);
    return {
      success: true,
      messageId: `sms_${Math.random().toString(36).substring(2, 10)}`,
      provider: "sms_gateway",
    };
  }
}

export class EmailProvider implements NotificationProvider {
  async send(options: SendNotificationOptions): Promise<NotificationSendResult> {
    // Simulate Email SMTP / SendGrid call
    await new Promise((resolve) => setTimeout(resolve, 350));
    console.log(`[Email SMTP] Sending to ${options.to} | Subject: ${options.subject}:`, options.message || options.templateName);
    return {
      success: true,
      messageId: `email_${Math.random().toString(36).substring(2, 10)}`,
      provider: "smtp_email",
    };
  }
}

export class CompositeNotificationProvider implements NotificationProvider {
  private whatsapp = new WhatsAppBusinessProvider();
  private sms = new SMSProvider();
  private email = new EmailProvider();

  async send(options: SendNotificationOptions): Promise<NotificationSendResult> {
    switch (options.channel) {
      case "whatsapp":
        return await this.whatsapp.send(options);
      case "sms":
        return await this.sms.send(options);
      case "email":
        return await this.email.send(options);
      default:
        throw new Error(`Unsupported notification channel: ${options.channel}`);
    }
  }
}

export const notificationProvider = new CompositeNotificationProvider();
