import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import path from 'path';

let Database: any;
try {
    Database = require('better-sqlite3');
} catch (e) {
    // Na Vercel serverless okruzenju sqlite modul se preskace
}

const getDb = () => {
    if (!Database) return null;
    try {
        const dbPath = path.join(process.cwd(), 'ai_jaran.db');
        return new Database(dbPath);
    } catch (e) {
        return null;
    }
};

function formatToBalkanDate(dateStr: string) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return parts[2] + '.' + parts[1] + '.' + parts[0] + '.';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const id = body.id;

        if (!id) {
            return NextResponse.json({ success: false, error: "ID rezervacije je obavezan." }, { status: 400 });
        }

        let reservation: any = null;

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceRoleKey) {
            const supabase = createClient(supabaseUrl, serviceRoleKey);

            const selectResult = await supabase.from('reservations').select('*').eq('id', id).maybeSingle();
            const data = selectResult.data;

            if (data) {
                let businessName = 'Dubinsko Catic';
                let ownerEmail = 'caticharun126@gmail.com';
                let telegramChatId = null;

                if (data.business_id) {
                    const businessResult = await supabase
                        .from('businesses')
                        .select('name, owner_email, telegram_chat_id')
                        .eq('id', data.business_id)
                        .maybeSingle();

                    if (businessResult.data) {
                        businessName = businessResult.data.name;
                        ownerEmail = businessResult.data.owner_email || ownerEmail;
                        telegramChatId = businessResult.data.telegram_chat_id;
                    }
                }

                const dateSplit = data.reservation_date ? data.reservation_date.split('T') : ['', ''];
                reservation = {
                    partnerName: businessName,
                    ownerEmail: ownerEmail,
                    telegramChatId: telegramChatId,
                    packageName: data.service_name,
                    price: data.price,
                    date: dateSplit[0] || '',
                    time: dateSplit[1] ? dateSplit[1].slice(0, 5) : '',
                    clientName: data.customer_name,
                    clientPhone: data.customer_phone,
                    clientEmail: data.customer_email || ''
                };
                await supabase.from('reservations').delete().eq('id', id);
            }
        }

        if (!reservation) {
            const db = getDb();
            if (db) {
                reservation = db.prepare('SELECT * FROM narudzbe_firmi WHERE id = ?').get(id);
                if (reservation) {
                    db.prepare('DELETE FROM narudzbe_firmi WHERE id = ?').run(id);
                }
                db.close();
            }
        }

        if (!reservation) {
            return NextResponse.json({ success: false, error: "Rezervacija nije pronadjena." }, { status: 404 });
        }

        const displayDate = formatToBalkanDate(reservation.date) || reservation.date;

        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = reservation.telegramChatId || process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                const telegramMessage = "OTKAZAN TERMIN!" + "\n\n" +
                    "Biznis: " + reservation.partnerName + "\n" +
                    "Paket: " + reservation.packageName + " (" + reservation.price + ")" + "\n" +
                    "Datum: " + displayDate + " u " + reservation.time + "\n\n" +
                    "Klijent: " + reservation.clientName + "\n" +
                    "Telefon: " + reservation.clientPhone + "\n" +
                    "Email: " + (reservation.clientEmail || 'Nije naveden');

                await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
                });
            }
        } catch (tgErr) {
            console.log("Telegram za otkazivanje nije poslan:", tgErr);
        }

        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                const ownerHtml =
                    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
                    '<tr><td style="padding:20px 0;">' +
                    '<h2 style="color:#dc2626;margin:0 0 10px 0;font-size:20px;">Rezervacija je otkazana</h2>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;">Klijent je otkazao svoj termin na platformi.</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Biznis:</b> ' + reservation.partnerName + '</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Usluga:</b> ' + reservation.packageName + ' (' + reservation.price + ')</p>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;"><b>Otkazani termin:</b> ' + displayDate + ' u ' + reservation.time + '</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Ime klijenta:</b> ' + reservation.clientName + '</p>' +
                    '<p style="font-size:14px;margin:0 0 4px 0;"><b>Telefon:</b> ' + reservation.clientPhone + '</p>' +
                    '<p style="font-size:14px;margin:0 0 16px 0;"><b>Email:</b> ' + (reservation.clientEmail || 'Nije naveden') + '</p>' +
                    '<p style="font-size:13px;color:#6b7280;margin:0;">' + reservation.partnerName + ' & AI Jaran</p>' +
                    '</td></tr></table>';

                await resend.emails.send({
                    from: 'AI Jaran <info@aijaran.ba>',
                    to: reservation.ownerEmail,
                    subject: 'OTKAZAN TERMIN: ' + reservation.partnerName + ' - ' + displayDate + ' u ' + reservation.time,
                    html: ownerHtml
                });

                if (reservation.clientEmail) {
                    const clientHtml =
                        '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1f2937;">' +
                        '<tr><td style="padding:20px 0;">' +
                        '<h2 style="color:#dc2626;margin:0 0 10px 0;font-size:20px;">Termin je otkazan</h2>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;">Postovani ' + reservation.clientName + ', vas termin je uspjesno otkazan.</p>' +
                        '<p style="font-size:14px;margin:0 0 4px 0;"><b>Usluga:</b> ' + reservation.partnerName + ' - ' + reservation.packageName + ' (' + reservation.price + ')</p>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;"><b>Otkazani termin:</b> ' + displayDate + ' u ' + reservation.time + '</p>' +
                        '<p style="font-size:14px;margin:0 0 16px 0;">Ukoliko zelis, mozes zakazati novi termin bilo kada preko nase platforme.</p>' +
                        '<p style="font-size:13px;color:#6b7280;margin:0;">S postovanjem,<br>' + reservation.partnerName + ' & AI Jaran</p>' +
                        '</td></tr></table>';

                    await resend.emails.send({
                        from: 'AI Jaran <info@aijaran.ba>',
                        to: reservation.clientEmail,
                        subject: 'Otkazan termin - ' + reservation.partnerName,
                        html: clientHtml
                    });
                }
            }
        } catch (emailErr) {
            console.log("Mejl za otkazivanje nije poslan:", emailErr);
        }

        return NextResponse.json({ success: true, message: "Rezervacija je uspjesno otkazana i obavjestenja su poslana." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}