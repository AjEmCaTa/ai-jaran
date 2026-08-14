import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: "Nedostaju GOOGLE_CLIENT_ID ili GOOGLE_CLIENT_SECRET.",
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

    const authorizationUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/calendar",
      ],
    });

    return NextResponse.redirect(authorizationUrl);
  } catch (error: any) {
    console.error("Google OAuth start error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error?.message ||
          "Greška prilikom pokretanja Google Calendar autorizacije.",
      },
      { status: 500 }
    );
  }
}