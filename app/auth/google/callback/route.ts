// app/api/auth/google/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Authorization code nedostaje.",
        },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Nedostaju serverske varijable okruženja.",
        },
        { status: 500 }
      );
    }

    const redirectUri = "https://aijaran.ba/api/auth/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          error: "Google nije vratio refresh token. Provjerite da li je aplikacija već bila autorizirana.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { error: dbError } = await supabase
      .from("google_calendar_tokens")
      .upsert({
        id: 1,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Supabase token save error:", dbError);
      return NextResponse.json(
        {
          success: false,
          error: "Greška prilikom spremanja tokena u bazu podataka.",
        },
        { status: 500 }
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: unknown) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Greška tijekom Google autentifikacije.",
      },
      { status: 500 }
    );
  }
}