import { IEmailService } from '../../../core/application/ports/out/IEmailService';
import { Resend } from 'resend';

export class ResendEmailService implements IEmailService {
  private resend: Resend | null;

  constructor(apiKey?: string) {
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.resend = null;
      console.warn('ResendEmailService: No API key provided, running in mock mode. Emails will not be sent.');
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (!this.resend) {
      console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
      console.log(`[MOCK EMAIL BODY] ${body}`);
      return;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: 'Booking SaaS <onboarding@resend.dev>', // Default for testing/dev
        to,
        subject,
        html: body
      });

      if (error) {
        console.error('Failed to send email:', error);
        throw new Error(`Email sending failed: ${error.message}`);
      }
    } catch (e: any) {
      console.error('Error in ResendEmailService:', e);
      throw e;
    }
  }
}
