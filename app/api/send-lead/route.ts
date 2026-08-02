import { NextResponse } from 'next/server';
const db = require('../../../db');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    // 1. Automatski upis u SQLite bazu
    await new Promise((resolve, reject) => {
      const query = `INSERT INTO narudzbe_firmi (naziv_firme, opis_firme, izabrani_paket, kontakt) VALUES (?, ?, ?, ?)`;
      const kontaktPodaci = `Email: ${email || '-'} | Tel: ${phone || '-'}`;
      
      db.run(query, [name, message, selectedPackage, kontaktPodaci], function(this: { lastID: number }, err: Error | null) {
        if (err) {
          console.error('Greška pri upisu u bazu:', err.message);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
    });

    // 2. Formatirana poruka za Telegram (glavna obavijest)
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

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Telegram Error:', errorData);
      throw new Error('Greška pri slanju Telegram obavještenja.');
    }

    return NextResponse.json({ success: true, telegram: true });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Greška pri obradi zahtjeva.' }, { status: 500 });
  }
}