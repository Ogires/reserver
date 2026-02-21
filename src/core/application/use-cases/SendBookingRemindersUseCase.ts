import { IBookingRepository } from '../ports/IBookingRepository';
import { IEmailService } from '../ports/out/IEmailService';

export class SendBookingRemindersUseCase {
  constructor(
    private repository: IBookingRepository,
    private emailService: IEmailService
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
        const email = await this.repository.getCustomerEmail(booking.customerId);
        if (!email) continue;

        const service = await this.repository.getServiceById(booking.serviceId);
        const serviceName = service?.nameTranslatable[tenant.defaultLanguage || 'es'] || 'Service';

        const rawTemplate = tenant.reminderTemplateBody || `<p>Reminder: Your booking for <strong>{{serviceName}}</strong> is coming up soon.</p>`;
        const finalBody = rawTemplate.replace('{{serviceName}}', serviceName);

        await this.emailService.sendEmail(
          email,
          `Reminder: Booking for ${serviceName}`,
          finalBody
        );

        await this.repository.updateBooking(booking.id, { reminderSentAt: now });
      }
    }
  }
}
