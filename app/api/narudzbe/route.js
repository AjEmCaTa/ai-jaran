import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const { data, error } = await supabase.from('reservations').select('*');
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { partnerName, packageName, price, durationHours, date, time, clientName, clientPhone, clientEmail } = body;

        // 1. Upis u Supabase tabelu "reservations"
        const { error: dbError } = await supabase.from('reservations').insert([
            {
                customer_name: clientName,
                customer_phone: clientPhone,
                customer_email: clientEmail,
                service_name: packageName,
                price: price,
                reservation_date: `${date}T${time}:00`,
                status: 'Na čekanju'
            }
        ]);

        if (dbError) {
            console.error("Greška pri upisu u Supabase:", dbError);
            throw new Error(dbError.message);
        }

        // 2. Slanje Telegram obavještenja
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                let formattedDate = date;
                const parts = date.split('-');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}.`;
                }
                const telegramMessage = `🔵 NOVA REZERVACIJA!\n\nBiznis: ${partnerName || 'Dubinsko Ćatić'}\nPaket: ${packageName} (${price})\nDatum: ${formattedDate} u ${time}\n\nKlijent: ${clientName}\nTelefon: ${clientPhone}\nEmail: ${clientEmail}`;
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
                });
            }
        } catch (tgErr) {
            console.log("Telegram greška (ignorišemo):", tgErr);
        }

        // 3. Slanje Resend mejlova
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                // Mejl za tebe
                await resend.emails.send({
                    from: 'AI Jaran <onboarding@resend.dev>',
                    to: 'caticharun126@gmail.com',
                    subject: `Nova rezervacija: ${partnerName || 'Usluga'} - ${date} u ${time}`,
                    html: `
                        <h2>Nova rezervacija primljena!</h2>
                        <p><b>Partner / Biznis:</b> ${partnerName || 'Dubinsko Ćatić'}</p>
                        <p><b>Paket:</b> ${packageName} (${price})</p>
                        <p><b>Datum i vrijeme:</b> ${date} u ${time}</p>
                        <h3>Podaci klijenta:</h3>
                        <p><b>Ime:</b> ${clientName}</p>
                        <p><b>Telefon:</b> ${clientPhone}</p>
                        <p><b>Mejl:</b> ${clientEmail}</p>
                    `
                });

                // Mejl za klijenta
                if (clientEmail) {
                    await resend.emails.send({
                        from: 'AI Jaran <onboarding@resend.dev>',
                        to: clientEmail,
                        subject: `Uspješno zakazan termin - ${partnerName || 'Dubinsko Ćatić'}`,
                        html: `
                            <h2>Uspješno ste zakazali termin!</h2>
                            <p>Poštovani ${clientName},</p>
                            <p>Vaš termin za <b>${packageName}</b> je uspješno potvrđen.</p>
                            <p><b>Termin:</b> ${date} u ${time}</p>
                            <p>Hvala vam na povjerenju!</p>
                        `
                    });
                }
            }
        } catch (emailErr) {
            console.log("Mejl nije poslan (ignorišemo da ne ruši aplikaciju):", emailErr);
        }

        return NextResponse.json({ success: true, message: "Uspješno spremljeno i obavještenja poslana!" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}