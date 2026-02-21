import { NextRequest, NextResponse } from 'next/server';
import { SupabaseBookingRepository } from '../../../../infrastructure/database/supabase/SupabaseBookingRepository';
import { ResendEmailService } from '../../../../infrastructure/notifications/resend/ResendEmailService';
import { TelegramService } from '../../../../infrastructure/notifications/telegram/TelegramService';
import { SendBookingRemindersUseCase } from '../../../../core/application/use-cases/SendBookingRemindersUseCase';

export async function GET(req: NextRequest) {
  // Check authorization
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const repository = new SupabaseBookingRepository();
    const emailService = new ResendEmailService(process.env.RESEND_API_KEY);
    const telegramService = new TelegramService(process.env.TELEGRAM_BOT_TOKEN);
    const useCase = new SendBookingRemindersUseCase(repository, emailService, telegramService);

    await useCase.execute();

    return NextResponse.json({ success: true, message: 'Reminders processed successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error processing reminders cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
