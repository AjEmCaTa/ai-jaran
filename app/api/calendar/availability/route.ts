import { NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        {
          success: false,
          error: "Datum nije poslan.",
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
          error: "Nedostaju GOOGLE_CLIENT_ID ili GOOGLE_CLIENT_SECRET.",
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

    // Google Calendar token je spremljen u redu sa id = 1.
    const { data: tokenData, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("refresh_token")
      .eq("id", 1)
      .single();

    if (tokenError || !tokenData?.refresh_token) {
      console.error(
        "Google Calendar token nije pronađen:",
        tokenError
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Google Calendar još nije povezan. Prvo poveži Google Calendar.",
        },
        { status: 500 }
      );
    }

    const refreshToken = tokenData.refresh_token;

    const redirectUri =
      "https://aijaran.ba/api/auth/google/callback";

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({
      version: "v3",
      auth: oauth2Client,
    });

    // Bosansko vrijeme.
    const timeMin = `${date}T00:00:00+02:00`;
    const timeMax = `${date}T23:59:59+02:00`;

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        timeZone: "Europe/Sarajevo",
        items: [
          {
            id: "primary",
          },
        ],
      },
    });

    const busy =
      response.data.calendars?.primary?.busy?.map((slot) => ({
        start: slot.start ?? null,
        end: slot.end ?? null,
      })) ?? [];

    return NextResponse.json({
      success: true,
      date,
      busy,
    });
  } catch (error: any) {
    console.error(
      "Google Calendar availability error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Greška prilikom provjere dostupnosti Google Calendara.",
      },
      { status: 500 }
    );
  }
}