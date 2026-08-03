import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
      throw new Error('Telegram kredencijali nisu podešeni u environment varijablama.');
    }

    const telegramMessage = `
🔔 **Novi zahtjev sa platforme!**

👤 **Ime / Firma:** ${name || 'Nije uneseno'}
📧 **Email:** ${email || 'Nije unesen'}
📞 **Telefon:** ${phone || 'Nije unesen'}
📦 **Paket:** ${selectedPackage || 'Nije izabran'}
💬 **Poruka / Opis:** ${message || 'Nema poruke'}
    `.trim();

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

    const telegramData = await telegramResponse.json();
    if (!telegramData.ok) {
      throw new Error('Greška pri slanju na Telegram API.');
    }

    return NextResponse.json({ success: true, telegram: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Greška pri obradi zahtjeva.' }, { status: 500 });
  }
}