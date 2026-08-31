// app/api/calendar/route.ts
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDate = searchParams.get("date");

    if (!rawDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Datum nije poslan.",
        },
        { status: 400 }
      );
    }

    // Normalizacija datuma: ako stigne npr. "31.8.2026" ili "31.08.2026", pretvori u "2026-08-31"
    let formattedDate = rawDate;
    if (rawDate.includes(".")) {
      const parts = rawDate.split(".");
      if (parts.length >= 3) {
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = parts[2];
        formattedDate = `${year}-${month}-${day}`;
      }
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Nedostaju potrebne serverske varijable okruženja.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: tokenData, error: tokenError } = await supabase
      .from("google_calendar_tokens")
      .select("refresh_token")
      .eq("id", 1)
      .maybeSingle();

    if (tokenError || !tokenData?.refresh_token) {
      console.warn(
        "Google Calendar token nije pronađen ili nije povezan, preskačem provjeru kalendara."
      );

      return NextResponse.json({
        success: true,
        date: rawDate,
        busy: [],
      });
    }

    const refreshToken = tokenData.refresh_token;
    const redirectUri = "https://aijaran.ba/api/auth/google/callback";

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

    const timeMin = `${formattedDate}T00:00:00+02:00`;
    const timeMax = `${formattedDate}T23:59:59+02:00`;

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
      date: rawDate,
      busy,
    });
  } catch (error: unknown) {
    console.error("Google Calendar availability error:", error);

    return NextResponse.json({
      success: true,
      date: "",
      busy: [],
    });
  }
}