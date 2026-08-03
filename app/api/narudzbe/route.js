import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
const path = require('path');

export async function GET() {
    try {
        const dbPath = path.join(process.cwd(), 'ai_jaran.db');
        const db = new Database(dbPath);
        const rows = db.prepare('SELECT * FROM narudzbe_firmi').all();
        db.close();
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}