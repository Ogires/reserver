import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TELEGRAM_SECRET_TOKEN = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // 1. Verify that this request comes from Telegram (if secret is configured)
  const secretToken = req.headers.get('x-telegram-bot-api-secret-token');
  if (TELEGRAM_SECRET_TOKEN && secretToken !== TELEGRAM_SECRET_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const update = await req.json();

    // Proceed only if it's a message with text
    if (update.message && update.message.text) {
      const text = update.message.text.trim();
      const chatId = update.message.chat.id.toString();

      // We expect the user to send their email or tenant slug to pair the account
      // Format: /start <email-or-slug>
      if (text.startsWith('/start ')) {
        const identifier = text.replace('/start ', '').trim();

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        let paired = false;

        // Try to match identifier with a Tenant (by slug)
        const { data: tenants } = await supabase
          .from('tenants')
          .select('id')
          .eq('slug', identifier);

        if (tenants && tenants.length > 0) {
          const tenantId = tenants[0].id;
          await supabase.from('tenants').update({ telegram_chat_id: chatId }).eq('id', tenantId);
          paired = true;
          await sendTelegramReply(chatId, `✅ Successfully linked this chat to your Tenant account (${identifier}). You will now receive booking alerts here.`);
        } 
        
        // If not a tenant, try to match with a Customer (by email)
        if (!paired) {
          const { data: customers } = await supabase
            .from('customers')
            .select('id')
            .eq('email', identifier);

          if (customers && customers.length > 0) {
            const customerId = customers[0].id;
            await supabase.from('customers').update({ telegram_chat_id: chatId }).eq('id', customerId);
            paired = true;
            await sendTelegramReply(chatId, `✅ Successfully linked this chat to your Customer account (${identifier}). You will now receive booking confirmations here.`);
          }
        }

        // Handle failure to match
        if (!paired) {
          await sendTelegramReply(chatId, `❌ Could not find a Tenant or Customer matching "${identifier}". \n\nPlease use \`/start your-slug\` or \`/start your-email@domain.com\``);
        }

      } else if (text === '/start') {
        await sendTelegramReply(chatId, `Welcome to Booking SaaS Bot! 🤖\n\nTo link this chat to your account and receive notifications, send me your email or tenant slug like this:\n\n\`/start john@example.com\``);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Helper directly in the route for this simple MVP webhook
async function sendTelegramReply(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
