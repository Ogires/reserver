import { IBookingRepository } from '../ports/IBookingRepository';
import { IEmailService } from '../ports/out/IEmailService';
import { ITelegramService } from '../ports/out/ITelegramService';

export class SendBookingRemindersUseCase {
  constructor(
    private repository: IBookingRepository,
    private emailService: IEmailService,
    private telegramService: ITelegramService
  ) {}

  async execute(): Promise<void> {
    const now = new Date();
    // Fetch bookings starting anywhere in the next 48 hours to be safe
    // (We will filter them against each tenant's reminderHoursPrior)
    const maxFuture = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const pendingReminders = await this.repository.getPendingReminders(now, maxFuture);

    for (const booking of pendingReminders) {
      const tenant = await this.repository.getTenantById(booking.tenantId);
      if (!tenant) continue;

      const reminderHours = tenant.reminderHoursPrior || 24;
      const timeToBookingHours = (booking.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      // check if it's time to send this reminder
      if (timeToBookingHours <= reminderHours && timeToBookingHours > 0) {
        
        const service = await this.repository.getServiceById(booking.serviceId);
        const serviceName = service?.nameTranslatable[tenant.defaultLanguage || 'es'] || 'Service';

        const notifyEmail = tenant.notifyEmailReminders !== false;
        const notifyTelegram = tenant.notifyTelegramReminders !== false;
        
        const notificationPromises = [];

        // Email Reminder
        if (notifyEmail) {
          const email = await this.repository.getCustomerEmail(booking.customerId);
          if (email) {
            const rawTemplate = tenant.reminderTemplateBody || `<p>Reminder: Your booking for <strong>{{serviceName}}</strong> is coming up soon.</p>`;
            const finalBody = rawTemplate.replace('{{serviceName}}', serviceName);

            notificationPromises.push(
              this.emailService.sendEmail(
                email,
                `Reminder: Booking for ${serviceName}`,
                finalBody
              )
            );
          }
        }

        // Telegram Reminder
        if (notifyTelegram) {
          const telegramChatId = await this.repository.getCustomerTelegramId(booking.customerId);
          if (telegramChatId) {
             notificationPromises.push(
               this.telegramService.sendMessage(
                 telegramChatId,
                 `⏰ <b>Booking Reminder</b>\n\nYour appointment for <b>${serviceName}</b> is coming up in less than ${reminderHours} hours.`
               )
             );
          }
        }

        if (notificationPromises.length > 0) {
           await Promise.allSettled(notificationPromises);
        }
        
        // Mark as sent regardless of configuration to ensure it's not repeatedly checked
        await this.repository.updateBooking(booking.id, { reminderSentAt: now });
      }
    }
  }
}
