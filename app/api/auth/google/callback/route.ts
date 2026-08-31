import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Nema autorizacijskog koda' }, { status: 400 });
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = 'https://aijaran.ba/api/auth/google/callback';

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok) {
      throw new Error(tokenData.error_description || 'Greška pri dohvaćanju tokena s Googlea');
    }

    const refreshToken = tokenData.refresh_token;

    if (!refreshToken) {
      return NextResponse.json({ 
        error: 'Google nije vratio refresh token. Provjeri jesi li u URL-u imao prompt=consent.' 
      }, { status: 400 });
    }

    const { error: dbError } = await supabase
      .from('google_calendar_tokens')
      .upsert({ 
        id: 1, 
        refresh_token: refreshToken, 
        updated_at: new Date().toISOString() 
      });

    if (dbError) {
      console.error("Supabase token save error:", dbError);
      throw dbError;
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);
    return NextResponse.json({ error: error.message || 'Greška' }, { status: 500 });
  }
}