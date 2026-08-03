import { NextResponse } from 'next/server';
const Database = require('better-sqlite3');
const path = require('path');

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, package: selectedPackage, message } = body;

    const dbPath = path.join(process.cwd(), 'ai_jaran.db');
    const db = new Database(dbPath);

    db.exec(`
      CREATE TABLE IF NOT EXISTS narudzbe_firmi (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        naziv_firme TEXT,
        opis_firme TEXT,
        izabrani_paket TEXT,
        kontakt TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const stmt = db.prepare(`INSERT INTO narudzbe_firmi (naziv_firme, opis_firme, izabrani_paket, kontakt) VALUES (?, ?, ?, ?)`);
    const kontaktPodaci = `Email: ${email || '-'} | Tel: ${phone || '-'}`;
    const result = stmt.run(name, message, selectedPackage, kontaktPodaci);
    db.close();

    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      const telegramMessage = `
🔔 **Novi zahtjev sa platforme!**

👤 **Ime / Firma:** ${name || 'Nije uneseno'}
📧 **Email:** ${email || 'Nije unesen'}
📞 **Telefon:** ${phone || 'Nije unesen'}
📦 **Paket:** ${selectedPackage || 'Nije izabran'}
💬 **Poruka / Opis:** ${message || 'Nema poruke'}
      `.trim();

      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: telegramMessage,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}