import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { Resend } from 'resend';
const path = require('path');

const getDb = () => {
    const dbPath = path.join(process.cwd(), 'ai_jaran.db');
    const db = new Database(dbPath);
    db.prepare(`
        CREATE TABLE IF NOT EXISTS narudzbe_firmi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            partnerName TEXT,
            packageName TEXT,
            price TEXT,
            durationHours INTEGER,
            date TEXT,
            time TEXT,
            clientName TEXT,
            clientPhone TEXT,
            clientEmail TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `).run();
    return db;
};

export async function GET() {
    try {
        const db = getDb();
        const rows = db.prepare('SELECT * FROM narudzbe_firmi').all();
        db.close();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { partnerName, packageName, price, durationHours, date, time, clientName, clientPhone, clientEmail } = body;

        // 1. Upis u bazu
        const db = getDb();
        const stmt = db.prepare(`
            INSERT INTO narudzbe_firmi (partnerName, packageName, price, durationHours, date, time, clientName, clientPhone, clientEmail)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        stmt.run(partnerName, packageName, price, durationHours, date, time, clientName, clientPhone, clientEmail);
        db.close();

        // 2. Slanje Telegram obavještenja o novoj rezervaciji
        try {
            const token = process.env.TELEGRAM_BOT_TOKEN;
            const chatId = process.env.TELEGRAM_CHAT_ID;
            if (token && chatId) {
                let formattedDate = date;
                const parts = date.split('-');
                if (parts.length === 3) {
                    formattedDate = `${parts[2]}.${parts[1]}.${parts[0]}.`;
                }
                const telegramMessage = `🔵 NOVA REZERVACIJA!\n\nBiznis: ${partnerName}\nPaket: ${packageName} (${price})\nDatum: ${formattedDate} u ${time}\n\nKlijent: ${clientName}\nTelefon: ${clientPhone}\nEmail: ${clientEmail}`;
                await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: telegramMessage }),
                });
            }
        } catch (tgErr) {
            console.log("Telegram greška (ignorišemo):", tgErr);
        }

        // 3. Slanje mejlova u pozadini
        try {
            const resendApiKey = process.env.RESEND_API_KEY;
            if (resendApiKey) {
                const resend = new Resend(resendApiKey);

                // Mejl za tebe / sistem
                await resend.emails.send({
                    from: 'AI Jaran <onboarding@resend.dev>',
                    to: 'caticharun126@gmail.com',
                    subject: `Nova rezervacija: ${partnerName} - ${date} u ${time}`,
                    html: `
                        <h2>Nova rezervacija primljena!</h2>
                        <p><b>Partner / Biznis:</b> ${partnerName}</p>
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
                        subject: `Uspješno zakazan termin - ${partnerName}`,
                        html: `
                            <h2>Uspješno ste zakazali termin!</h2>
                            <p>Poštovani ${clientName},</p>
                            <p>Vaš termin za <b>${packageName}</b> kod partnera <b>${partnerName}</b> je uspješno potvrđen.</p>
                            <p><b>Termin:</b> ${date} u ${time}</p>
                            <p>Hvala vam što koristite naše usluge!</p>
                        `
                    });
                }
            }
        } catch (emailErr) {
            console.log("Mejl nije poslan (ignorišemo da ne ruši aplikaciju):", emailErr);
        }

        return NextResponse.json({ success: true, message: "Uspješno spremljeno!" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}