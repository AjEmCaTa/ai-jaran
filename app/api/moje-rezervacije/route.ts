import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, serviceKey);
const authSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');

async function getUser(request: NextRequest) {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return null;
    const { data, error } = await authSupabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user;
}

// Lista rezervacija prijavljenog korisnika
export async function GET(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Prijavite se da vidite svoje termine.' }, { status: 401 });
        }

        const result = await supabase
            .from('reservations')
            .select('id, business_id, service_name, price, reservation_date, status')
            .eq('user_id', user.id)
            .order('reservation_date', { ascending: true });
        if (result.error) throw result.error;

        const rows = result.data || [];
        const businessIds = Array.from(new Set(rows.map((r: any) => r.business_id).filter(Boolean)));
        const names: Record<string, string> = {};
        if (businessIds.length > 0) {
            const biz = await supabase.from('businesses').select('id, name').in('id', businessIds);
            (biz.data || []).forEach((b: any) => { names[b.id] = b.name; });
        }

        const data = rows.map((r: any) => ({
            id: r.id,
            service_name: r.service_name,
            price: r.price,
            reservation_date: r.reservation_date,
            status: r.status,
            business_name: names[r.business_id] || ''
        }));

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Otkazivanje: provjeri da termin pripada korisniku, pa pozovi postojecu rutu koja brise i salje obavjestenja
export async function POST(request: NextRequest) {
    try {
        const user = await getUser(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Prijavite se prije otkazivanja.' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const id = body.id;
        if (!id) {
            return NextResponse.json({ success: false, error: 'ID rezervacije je obavezan.' }, { status: 400 });
        }

        const check = await supabase
            .from('reservations')
            .select('id')
            .eq('id', id)
            .eq('user_id', user.id)
            .maybeSingle();
        if (check.error) throw check.error;
        if (!check.data) {
            return NextResponse.json({ success: false, error: 'Termin nije pronađen.' }, { status: 404 });
        }

        const cancelUrl = new URL('/api/cancel-appointment', request.url);
        const cancelRes = await fetch(cancelUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });
        const cancelJson = await cancelRes.json().catch(() => ({}));
        return NextResponse.json(cancelJson, { status: cancelRes.status });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}