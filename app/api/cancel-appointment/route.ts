import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import path from 'path';

// Opcionalni SQLite fallback ako se koristi lokalno
let Database: any;
try {
    Database = require('better-sqlite3');
} catch (e) {
    // Na Vercel serverless okruženju sqlite modul se preskače
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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "ID rezervacije je obavezan." }, { status: 400 });
        }

        let reservation: any = null;

        // 1. Prvo pokušamo obrisati iz Supabase baze (ako je dostupna)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (supabaseUrl && serviceRoleKey) {
            const supabase = createClient(supabaseUrl, serviceRoleKey);
            
            // Dohvati podatke prije brisanja
            const { data } = await supabase.from('reservations').select('*').eq('id', id).maybeSingle();
            if (data) {
                reservation = {
                    partnerName: data.partner_name || 'Dubinsko Ćatić',
                    packageName: data.service_name,
                    price: `${data.price} KM`,
                    date: data.reservation_date ? data.reservation_date.split('T')[0] : '',
                    time: data.reservation_date ? data.reservation_date.split('T')[1]?.slice(0, 5) : '',
                    clientName: data.customer_name,
                    clientPhone: data.customer_phone,
                    clientEmail: data.customer_email || ''
                };
                await supabase.from('reservations').delete().eq('id', id);
            }
        }

        // 2. Ako nije pronađeno u Supabase, pokušavamo u SQLite bazi
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
            return NextResponse.json({ success: false, error: "Rezervacija nije pronađena." }, { status: 404 });
        }

        // 3. Slanje obavještenja o otkazivanju (Resend mejlovi)
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                // Email vlasniku
                await resend.emails.send({
                    from: 'AI Jaran <info@aijaran.ba>',
                    to: 'caticharun126@gmail.com',
                    subject: `OTKAZAN TERMIN: ${reservation.partnerName} - ${reservation.date} u ${reservation.time}`,
                    html: `
                        <h2>Rezervacija je otkazana!</h2>
                        <p><b>Partner / Biznis:</b> ${reservation.partnerName}</p>
                        <p><b>Paket:</b> ${reservation.packageName} (${reservation.price})</p>
                        <p><b>Termin koji je otkazan:</b> ${reservation.date} u ${reservation.time}</p>
                        <h3>Podaci klijenta:</h3>
                        <p><b>Ime:</b> ${reservation.clientName}</p>
                        <p><b>Telefon:</b> ${reservation.clientPhone}</p>
                        <p><b>Mejl:</b> ${reservation.clientEmail || 'Nije naveden'}</p>
                    `
                });

                // Email klijentu
                if (reservation.clientEmail) {
                    await resend.emails.send({
                        from: 'AI Jaran <info@aijaran.ba>',
                        to: reservation.clientEmail,
                        subject: `Otkazan termin - ${reservation.partnerName}`,
                        html: `
                            <h2>Termin je uspješno otkazan</h2>
                            <p>Poštovani ${reservation.clientName},</p>
                            <p>Vaš termin za <b>${reservation.packageName}</b> kod partnera <b>${reservation.partnerName}</b> zakazan za ${reservation.date} u ${reservation.time} je uspješno otkazan.</p>
                            <p>Nadamo se ponovnoj saradnji!</p>
                        `
                    });
                }
            }
        } catch (emailErr) {
            console.log("Mejl za otkazivanje nije poslan:", emailErr);
        }

        return NextResponse.json({ success: true, message: "Rezervacija je uspješno otkazana i obavještenja su poslana." });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}