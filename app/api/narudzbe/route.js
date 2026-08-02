import { NextResponse } from 'next/server';
const db = require('@/db'); // Povezujemo se na našu bazu iz korijena

export async function POST(request) {
    try {
        const body = await request.json();
        const { naziv_firme, opis_firme, izabrani_paket, kontakt } = body;

        return new Promise((resolve) => {
            const query = `INSERT INTO narudzbe_firmi (naziv_firme, opis_firme, izabrani_paket, kontakt) VALUES (?, ?, ?, ?)`;
            
            db.run(query, [naziv_firme, opis_firme, izabrani_paket, kontakt], function(err) {
                if (err) {
                    resolve(NextResponse.json({ success: false, error: err.message }, { status: 500 }));
                } else {
                    resolve(NextResponse.json({ success: true, id: this.lastID }, { status: 200 }));
                }
            });
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: 'Greška na serveru' }, { status: 500 });
    }
}