import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    // 1. Formatirana poruka za Telegram (pregledna, na redove sa ikonicama)
    const telegramMessage = `
🔔 **Novi zahtjev sa platforme!**

👤 **Ime:** ${name || 'Nije uneseno'}
📧 **Email:** ${email || 'Nije unesen'}
📞 **Telefon:** ${phone || 'Nije unesen'}
📦 **Paket:** ${selectedPackage || 'Nije izabran'}
💬 **Poruka:** ${message || 'Nema poruke'}
    `.trim();

    // Slanje na Telegram
    const telegramUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown',
      }),
    });

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram Error:', errorData);
    }

    // 2. Formatiran HTML e-mail preko Resend-a
    const emailResponse = await resend.emails.send({
      from: 'AI Jaran <onboarding@resend.dev>', // Koristimo provjerenu Resend testnu adresu da sigurno prođe
      to: [process.env.ADMIN_EMAIL || 'caticharun126@gmail.com'],
      subject: `🔔 Novi upit: ${name || 'Klijent'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
          <h2 style="color: #333; border-bottom: 2px solid #0070f3; padding-bottom: 10px; margin-top: 0;">Novi upit sa web stranice</h2>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555; width: 30%;">Ime:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${name || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px side; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${email || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Telefon:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${phone || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; color: #555;">Paket:</td>
              <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${selectedPackage || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; color: #555; vertical-align: top;">Poruka:</td>
              <td style="padding: 10px; color: #333; white-space: pre-wrap;">${message || '-'}</td>
            </tr>
          </table>
          <p style="font-size: 12px; color: #888; text-align: center; margin-top: 25px;">Ova poruka je automatski generisana sa Vaše web platforme.</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, telegram: telegramResponse.ok, email: emailResponse });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: 'Greška pri slanju poruke.' }, { status: 500 });
  }
}