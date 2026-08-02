import { NextResponse } from 'next/server';
const path = require('path');

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'ai_jaran.db');
        const Database = eval('require')('better-sqlite3');
        const db = new Database(dbPath);
        const rows = db.prepare('SELECT * FROM narudzbe_firmi').all();
        db.close();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}