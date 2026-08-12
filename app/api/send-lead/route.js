import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ success: false, error: 'Nedostaju Telegram environment varijable na serveru.' }, { status: 500 });
    }

    // 1. Slanje na Telegram (uvijek ide)
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

    // 2. Slanje emaila preko Resenda - SAMO ako je klijent unio email adresu!
    if (email && email.trim() !== '') {
      try {
        // Formatiranje datuma ako postoji u poruci (npr. iz YYYY-MM-DD u DD.MM.YYYY)
        let formattedMessage = message || 'Nema poruke';
        const dateMatch = formattedMessage.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
          const [_, year, month, day] = dateMatch;
          formattedMessage = formattedMessage.replace(`${year}-${month}-${day}`, `${day}.${month}.${year}.`);
        }

        await resend.emails.send({
          from: 'Dubinsko Ćatić <info@aijaran.ba>',
          to: [email, 'caticharun126@gmail.com'],
          subject: 'Potvrda rezervacije termina – Dubinsko Ćatić',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
              <h2 style="color: #2563eb; margin-top: 0;">Pozdrav ${name || 'korisniče'},</h2>
              <p>Hvala ti na povjerenju! Uspješno si poslao zahtjev / zakazao termin.</p>
              
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                <p style="margin: 5px 0;"><strong>Izabrana usluga / paket:</strong> ${selectedPackage || 'Nije izabran'}</p>
                <p style="margin: 5px 0;"><strong>Detalji:</strong> ${formattedMessage}</p>
              </div>

              <p>Vidimo se u dogovoreno vrijeme! Ako budeš želio pomjeriti ili otkazati termin, možeš to učiniti direktno preko naše platforme.</p>
              
              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">S poštovanjem,<br><strong>Dubinsko Ćatić & AI Jaran</strong></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Greška pri slanju emaila:', emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Catch Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Greška pri obradi zahtjeva.' }, { status: 500 });
  }
}