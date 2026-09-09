import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nedostaju Telegram environment varijable na serveru.',
        },
        { status: 500 }
      );
    }

    // 1. Slanje na Telegram
    const telegramMessage = `🚀 Novi zahtjev za POSLO ONE!

Ime / Firma: ${name || 'Nije uneseno'}
Email: ${email || 'Nije unesen'}
Telefon: ${phone || 'Nije unesen'}
Izabrani paket: ${selectedPackage || 'Nije izabran'}
Poruka: ${message || 'Nema poruke'}`;

    const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage`;

    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: telegramMessage,
      }),
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API Error Response:', telegramData);

      return NextResponse.json(
        {
          success: false,
          error: `Telegram Error: ${
            telegramData.description || 'Nepoznata greška'
          }`,
        },
        { status: 500 }
      );
    }

    // 2. Slanje emaila potvrde klijentu - SAMO ako je unio email
    if (email && email.trim() !== '') {
      try {
        const emailResult = await resend.emails.send({
          from: 'POSLO ONE <info@aijaran.ba>',
          to: [email, 'caticharun126@gmail.com'],
          subject: 'Uspješno poslan zahtjev – POSLO ONE',
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #030712; color: #fff;">
              
              <h2 style="color: #3b82f6; margin-top: 0;">
                Pozdrav ${name || 'korisniče'},
              </h2>

              <p>
                Hvala ti na povjerenju! Uspješno smo primili tvoj zahtjev za
                <strong>POSLO ONE</strong>.
              </p>

              <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                
                <p style="margin: 5px 0;">
                  <strong>Izabrani paket:</strong>
                  ${selectedPackage || 'Nije izabran'}
                </p>

                <p style="margin: 5px 0;">
                  <strong>Poruka:</strong>
                  ${message || 'Nema dodatne poruke'}
                </p>

              </div>

              <p>
                Vaš zahtjev je uspješno zaprimljen. Uskoro će vam se javiti
                neko iz <strong>POSLO ONE</strong> tima.
              </p>

              <p style="margin-top: 30px; font-size: 14px; color: #9ca3af;">
                S poštovanjem,<br>
                <strong>POSLO ONE Tim</strong>
              </p>

            </div>
          `,
        });

        console.log('Resend Email Success:', emailResult);
      } catch (emailError: any) {
        console.error('Greška pri slanju emaila:', emailError);

        return NextResponse.json(
          {
            success: false,
            error: `Greška pri slanju emaila: ${emailError.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API Catch Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Greška pri obradi zahtjeva.',
      },
      { status: 500 }
    );
  }
}