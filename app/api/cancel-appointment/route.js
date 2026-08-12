import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { name, email, date, time, service } = await request.json();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    // Formatiranje datuma iz YYYY-MM-DD u DD.MM.YYYY.
    let formattedDate = date;
    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const [year, month, day] = parts;
        formattedDate = `${day}.${month}.${year}.`;
      }
    }

    // 1. Obavijesti sebe na Telegram (ostavljamo izvorni datum ili formatirani, kako ti draže)
    const telegramMessage = `❌ TERMIN OTKAZAN!\n\nKlijent: ${name}\nUsluga: ${service}\nDatum: ${formattedDate}\nVrijeme: ${time}`;
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
    });

    // 2. Pošalji mail klijentu
    if (email) {
      await resend.emails.send({
        from: 'Dubinsko Ćatić <info@aijaran.ba>',
        to: [email, 'caticharun126@gmail.com'], // Možeš staviti i sebi kopiju da znaš da je otkazano
        subject: 'Potvrda otkazivanja termina – Dubinsko Ćatić',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #ef4444; margin-top: 0;">Pozdrav ${name || 'korisniče'},</h2>
            <p>Obavještavamo te da je tvoj termin uspješno otkazan.</p>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ef4444;">
              <p style="margin: 5px 0;"><strong>Otkazana usluga:</strong> ${service || 'Nije izabrano'}</p>
              <p style="margin: 5px 0;"><strong>Termin:</strong> ${formattedDate} u ${time}</p>
            </div>

            <p>Ako se predomisliš ili želiš odabrati novi termin, uvijek možeš posjetiti našu platformu.</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">S poštovanjem,<br><strong>Dubinsko Ćatić & AI Jaran</strong></p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}