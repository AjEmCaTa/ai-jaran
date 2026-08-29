import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { Resend } from 'resend';
const path = require('path');

const getDb = () => {
    const dbPath = path.join(process.cwd(), 'ai_jaran.db');
    return new Database(dbPath);
};

export async function POST(request) {
    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: "ID rezervacije je obavezan." }, { status: 400 });
        }

        const db = getDb();

        // 1. Prvo pronađemo rezervaciju da imamo podatke za mejl prije nego što je obrišemo
        const reservation = db.prepare('SELECT * FROM narudzbe_firmi WHERE id = ?').get(id);

        if (!reservation) {
            db.close();
            return NextResponse.json({ success: false, error: "Rezervacija nije pronađena." }, { status: 404 });
        }

        // 2. Brišemo rezervaciju iz baze
        db.prepare('DELETE FROM narudzbe_firmi WHERE id = ?').run(id);
        db.close();

        // 3. Slanje obavještenja o otkazivanju (Resend mejlovi)
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                // Mejl tebi da je termin otkazan
                await resend.emails.send({
                    from: 'AI Jaran <onboarding@resend.dev>',
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
                        <p><b>Mejl:</b> ${reservation.clientEmail}</p>
                    `
                });

                // Mejl klijentu da je otkazivanje uspješno
                if (reservation.clientEmail) {
                    await resend.emails.send({
                        from: 'AI Jaran <onboarding@resend.dev>',
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
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}