import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
    try {
        const { data, error } = await supabase.from('reservations').select('*');
        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.json().catch(() => ({}));
        console.log("Primljeni body sa frontenda:", rawBody);

        const body = rawBody.formData || rawBody;

        const partnerName = body.partnerName || body.businessName || body.biznis || 'Dubinsko Ćatić';
        const packageName = body.packageName || body.package || body.service || body.serviceName || 'Odabrani paket';
        const price = body.price || '0 KM';
        const date = body.date || body.selectedDate || body.reservationDate || body.datum || body.reservation_date || '';
        const time = body.time || body.selectedTime || body.vrijeme || body.reservation_time || '';
        const vehicle = body.vehicle || body.vozilo || body.car || '';

        const clientName = body.clientName || body.name || body.customer_name || body.customerName || '';
        const clientPhone = body.clientPhone || body.phone || body.customer_phone || body.customerPhone || '';
        const clientEmail = body.clientEmail || body.email || body.customer_email || body.customerEmail || '';

        if (!clientName) {
            return NextResponse.json({ success: false, error: "Ime klijenta je obavezno!" }, { status: 400 });
        }

        let formattedDate = date;
        const parts = date ? date.split('-') : [];
        if (parts.length === 3) {
            formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}.`;
        }
        const displayDate = formattedDate || date;

        // 1. Upis u Supabase tabelu "reservations"
        const { error: dbError } = await supabase.from('reservations').insert([
            {
                customer_name: clientName,
                customer_phone: clientPhone,
                customer_email: clientEmail,
                service_name: `${packageName} ${vehicle ? `- Vozilo: ${vehicle}` : ''}`,
                price: price,
                reservation_date: date && time ? `${date}T${time}:00` : new Date().toISOString(),
                status: 'Na čekanju'
            }
        ]);

        if (dbError) {
            console.error("Greška pri upisu u Supabase:", dbError);
            return NextResponse.json({ success: false, error: dbError.message }, { status: 500 });
        }

        // 2. Slanje Telegram obavještenja
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                const telegramMessage = `🔵 NOVA REZERVACIJA!\n\nBiznis: ${partnerName}\nPaket: ${packageName} (${price})\nDatum: ${displayDate} u ${time}${vehicle ? `\nVozilo: ${vehicle}` : ''}\n\nKlijent: ${clientName}\nTelefon: ${clientPhone}\nEmail: ${clientEmail || 'Nije naveden'}`;
                
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
                });
            }
        } catch (tgErr) {
            console.error("Telegram greška:", tgErr);
        }

        // 3. Slanje Resend mejlova
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const { Resend } = await import('resend');
                const resend = new Resend(resendApiKey);

                // A) Mejl VLASNIKU
                const ownerEmailHtml = `
                    <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
                        <h2 style="color: #2563eb; margin-top: 0; font-size: 22px;">Nova rezervacija primljena!</h2>
                        <p style="font-size: 15px; line-height: 1.5;">Zaprimljen je novi zahtjev za termin na platformi.</p>
                        
                        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 0 0 8px 0; font-size: 15px;"><b>Usluga / paket:</b> ${packageName} (${price})</p>
                            <p style="margin: 0; font-size: 14px; color: #4b5563;"><b>Detalji:</b> 📅 Datum: ${displayDate} | ⏰ Vrijeme: ${time} ${vehicle ? `| 🚗 Vozilo: ${vehicle}` : ''}</p>
                        </div>

                        <div style="background-color: #eff6ff; padding: 15px; border-radius: 4px; margin: 20px 0;">
                            <h3 style="margin-top: 0; color: #1e40af; font-size: 16px;">Podaci o klijentu:</h3>
                            <p style="margin: 5px 0; font-size: 14px;"><b>Ime:</b> ${clientName}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><b>Telefon:</b> ${clientPhone}</p>
                            <p style="margin: 5px 0; font-size: 14px;"><b>Email:</b> ${clientEmail || 'Nije naveden'}</p>
                        </div>
                        
                        <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">
                            <b>${partnerName} & AI Jaran</b>
                        </p>
                    </div>
                `;

                await resend.emails.send({
                    from: `${partnerName} <info@aijaran.ba>`,
                    to: 'caticharun126@gmail.com',
                    subject: `Nova rezervacija: ${clientName} - ${displayDate} u ${time}`,
                    html: ownerEmailHtml
                });

                // B) Mejl KLIJENTU
                if (clientEmail) {
                    const clientEmailHtml = `
                        <div style="font-family: Arial, sans-serif; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
                            <h2 style="color: #2563eb; margin-top: 0; font-size: 22px;">Pozdrav ${clientName},</h2>
                            <p style="font-size: 15px; line-height: 1.5;">Hvala ti na povjerenju! Uspješno si poslao zahtjev / zakazao termin.</p>
                            
                            <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0 0 8px 0; font-size: 15px;"><b>Izabrana usluga / paket:</b> ${partnerName} - ${packageName} (${price})</p>
                                <p style="margin: 0; font-size: 14px; color: #4b5563;"><b>Detalji:</b> 📅 Datum: ${displayDate} | ⏰ Vrijeme: ${time} ${vehicle ? `| 🚗 Vozilo: ${vehicle}` : ''}</p>
                            </div>
                            
                            <p style="font-size: 15px; line-height: 1.5;">Vidimo se u dogovoreno vrijeme! Ako budeš želio pomjeriti ili otkazati termin, možeš to učiniti direktno preko naše platforme.</p>
                            
                            <p style="margin-top: 30px; font-size: 14px; color: #4b5563;">
                                S poštovanjem,<br>
                                <b>${partnerName} & AI Jaran</b>
                            </p>
                        </div>
                    `;

                    await resend.emails.send({
                        from: `${partnerName} <info@aijaran.ba>`,
                        to: clientEmail,
                        subject: `Uspješno zakazan termin - ${partnerName}`,
                        html: clientEmailHtml
                    });
                }
            }
        } catch (emailErr) {
            console.error("Resend greška:", emailErr);
        }

        return NextResponse.json({ success: true, message: "Uspješno spremljeno i obavještenja poslana!" });
    } catch (error: any) {
        console.error("Glavna API greška:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}