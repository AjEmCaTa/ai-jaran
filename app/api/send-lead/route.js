import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ success: false, error: 'Nedostaju Telegram environment varijable na serveru.' }, { status: 500 });
    }

    const telegramMessage = `Novi zahtjev sa platforme:\n\nIme / Firma: ${name || 'Nije uneseno'}\nEmail: ${email || 'Nije unesen'}\nTelefon: ${phone || 'Nije unesen'}\nPaket: ${selectedPackage || 'Nije izabran'}\nPoruka: ${message || 'Nema poruke'}`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
      }),
    });

    const telegramData = await telegramResponse.json();
    
    if (!telegramData.ok) {
      console.error('Telegram API Error Response:', telegramData);
      return NextResponse.json({ success: false, error: `Telegram Error: ${telegramData.description || 'Nepoznata greška'}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Catch Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Greška pri obradi zahtjeva.' }, { status: 500 });
  }
}