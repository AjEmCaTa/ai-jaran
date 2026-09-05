import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

function formatToBalkanDate(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return parts[2] + '.' + parts[1] + '.' + parts[0] + '.';
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const businessSlug = searchParams.get('business');

        let query = supabase.from('reservations').select('*');

        if (businessSlug) {
            const businessResult = await supabase
                .from('businesses')
                .select('id')
                .eq('slug', businessSlug)
                .maybeSingle();

            if (businessResult.data) {
                query = query.eq('business_id', businessResult.data.id);
            }
        }

        const result = await query;
        if (result.error) throw result.error;
        return NextResponse.json({ success: true, data: result.data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(function () { return {}; });
        console.log("Primljeni body sa frontenda:", body);

        const businessSlug = body.business_slug || 'dubinsko-catic';

        const businessResult = await supabase
            .from('businesses')
            .select('id, name, owner_email, telegram_chat_id')
            .eq('slug', businessSlug)
            .maybeSingle();

        if (!businessResult.data) {
            return NextResponse.json({ success: false, error: "Biznis nije pronadjen (slug: " + businessSlug + ")" }, { status: 404 });
        }

        const business = businessResult.data;

        const reservationDate = body.reservation_date || '';
        const dateSplit = reservationDate.split('T');
        const datePart = dateSplit[0] || '';
        const timePartRaw = dateSplit[1] || '';
        const time = timePartRaw ? timePartRaw.slice(0, 5) : '';

        const partnerName = business.name;
        const packageName = body.service_name || body.packageName || body.service || body.serviceName || 'Odabrani paket';
        const price = body.price ? (body.price + ' KM') : (body.priceLabel || '0 KM');
        const vehicle = body.vehicle || body.vozilo || body.car || '';
        const durationMinutes = body.duration_minutes ? Number(body.duration_minutes) : 120;

        const clientName = body.customer_name || body.clientName || body.name || '';
        const clientPhone = body.customer_phone || body.clientPhone || body.phone || '';
        const clientEmail = body.customer_email || body.clientEmail || body.email || '';

        if (!clientName) {
            return NextResponse.json({ success: false, error: "Ime klijenta je obavezno!" }, { status: 400 });
        }
        if (!reservationDate) {
            return NextResponse.json({ success: false, error: "Datum i vrijeme termina su obavezni!" }, { status: 400 });
        }

        const displayDate = formatToBalkanDate(datePart) || datePart;
        const vehicleSuffix = vehicle ? (' - Vozilo: ' + vehicle) : '';
        const vehicleInfo = vehicle ? (' | Vozilo: ' + vehicle) : '';

        const insertResult = await supabase.from('reservations').insert([
            {
                business_id: business.id,
                customer_name: clientName,
                customer_phone: clientPhone,
                customer_email: clientEmail,
                service_name: packageName + vehicleSuffix,
                price: price,
                reservation_date: reservationDate,
                duration_minutes: durationMinutes,
                status: 'Na cekanju'
            }
        ]).select();

        if (insertResult.error) {
            console.error("Greska pri upisu u Supabase:", insertResult.error);
            return NextResponse.json({ success: false, error: insertResult.error.message }, { status: 500 });
        }

        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = business.telegram_chat_id || process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                const vehicleLine = vehicle ? ('\nVozilo: ' + vehicle) : '';
                const telegramMessage = "NOVA REZERVACIJA!\n\nBiznis: " + partnerName + "\nPaket: " + packageName + " (" + price + ")\nDatum: " + displayDate + " u " + time + " (traje " + durationMinutes + " min)" + vehicleLine + "\n\nKlijent: " + clientName + "\nTelefon: " + clientPhone + "\nEmail: " + (clientEmail || 'Nije naveden');

                await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
                });
            }
        } catch (tgErr) {
            console.error("Telegram greska:", tgErr);
        }

        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resendModule = await import('resend');
                const Resend = resendModule.Resend;
                const resend = new Resend(resendApiKey);

                const ownerEmailHtml =
                    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
                    '<tr><td style="padding:20px 0;">' +
                    '<h2 style="color:#2563eb;margin:0 0 10px 0;font-size:20px;">Nova rezervacija primljena</h2>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;">Zaprimljen je novi zahtjev za termin na platformi.</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Usluga:</b> ' + packageName + ' (' + price + ')</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Datum:</b> ' + displayDate + '</p>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;"><b>Vrijeme:</b> ' + time + vehicleInfo + '</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Klijent:</b> ' + clientName + '</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Telefon:</b> ' + clientPhone + '</p>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;"><b>Email:</b> ' + (clientEmail || 'Nije naveden') + '</p>' +
                    '<p style="font-size:13px;color:#6b7280;margin:0;">' + partnerName + ' & AI Jaran</p>' +
                    '</td></tr></table>';

                await resend.emails.send({
                    from: partnerName + ' <info@aijaran.ba>',
                    to: business.owner_email || 'caticharun126@gmail.com',
                    subject: 'Nova rezervacija: ' + clientName + ' - ' + displayDate + ' u ' + time,
                    html: ownerEmailHtml
                });

                if (clientEmail) {
                    const clientEmailHtml =
                        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
                        '<tr><td style="padding:20px 0;">' +
                        '<h2 style="color:#2563eb;margin:0 0 10px 0;font-size:20px;">Pozdrav ' + clientName + '</h2>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;">Hvala ti na povjerenju! Uspjesno si zakazao termin.</p>' +
                        '<p style="font-size:14px;margin:0 0 4px 0;"><b>Usluga:</b> ' + partnerName + ' - ' + packageName + ' (' + price + ')</p>' +
                        '<p style="font-size:14px;margin:0 0 4px 0;"><b>Datum:</b> ' + displayDate + '</p>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;"><b>Vrijeme:</b> ' + time + vehicleInfo + '</p>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;">Vidimo se u dogovoreno vrijeme! Ako budes zelio pomjeriti ili otkazati termin, mozes to uciniti direktno preko nase platforme.</p>' +
                        '<p style="font-size:13px;color:#6b7280;margin:0;">S postovanjem,<br>' + partnerName + ' & AI Jaran</p>' +
                        '</td></tr></table>';

                    await resend.emails.send({
                        from: partnerName + ' <info@aijaran.ba>',
                        to: clientEmail,
                        subject: 'Uspjesno zakazan termin - ' + partnerName,
                        html: clientEmailHtml
                    });
                }
            }
        } catch (emailErr) {
            console.error("Resend greska:", emailErr);
        }

        return NextResponse.json({ success: true, data: insertResult.data, message: "Uspjesno spremljeno i obavjestenja poslana!" });
    } catch (error: any) {
        console.error("Glavna API greska:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}