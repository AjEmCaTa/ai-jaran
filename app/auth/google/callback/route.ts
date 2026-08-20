import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Google OAuth greška: ${error}`,
        },
        { status: 400 }
      );
    }

    if (!code) {
      return NextResponse.json(
        {
          success: false,
          error: "Google nije vratio authorization code.",
        },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nedostaju GOOGLE_CLIENT_ID ili GOOGLE_CLIENT_SECRET.",
        },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Nedostaju NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    const redirectUri =
      "https://aijaran.ba/api/auth/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google nije vratio refresh token. Ponovo odobri pristup Google Calendaru.",
        },
        { status: 400 }
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * AI Jaran trenutno koristi jedan administratorski
     * Google Calendar.
     *
     * Koristimo id = 1 jer je id u Supabase tabeli int8.
     */

    const { error: saveError } = await supabase
      .from("google_calendar_tokens")
      .upsert(
        {
          id: 1,
          access_token: tokens.access_token ?? null,
          refresh_token: tokens.refresh_token,
        },
        {
          onConflict: "id",
        }
      );

    if (saveError) {
      console.error(
        "Greška pri spremanju Google Calendar tokena:",
        saveError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Google je autorizovan, ali token nije moguće spremiti u bazu.",
          details: saveError.message,
        },
        { status: 500 }
      );
    }

    console.log(
      "Google Calendar autorizacija i spremanje tokena uspješni."
    );

    return new NextResponse(
      `
        <!DOCTYPE html>
        <html lang="bs">
          <head>
            <meta charset="UTF-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <title>Google Calendar povezan</title>

            <style>
              body {
                font-family: Arial, sans-serif;
                background: #f8fafc;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
              }

              .box {
                background: white;
                padding: 35px;
                border-radius: 16px;
                max-width: 600px;
                width: calc(100% - 40px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.08);
              }

              h1 {
                color: #16a34a;
                margin-top: 0;
              }

              p {
                color: #475569;
                line-height: 1.6;
              }
            </style>
          </head>

          <body>
            <div class="box">
              <h1>Google Calendar je povezan ✅</h1>

              <p>
                AI Jaran je uspješno povezan sa Google Calendarom.
              </p>

              <p>
                Pristup Google Calendaru je uspješno spremljen.
              </p>

              <p>
                Sada možemo povezati online kalendar sa stvarnim
                zauzetim terminima i rezervacijama.
              </p>
            </div>
          </body>
        </html>
      `,
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      }
    );
  } catch (error: any) {
    console.error("Google OAuth callback error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Greška prilikom povezivanja Google Calendara.",
      },
      { status: 500 }
    );
  }
}