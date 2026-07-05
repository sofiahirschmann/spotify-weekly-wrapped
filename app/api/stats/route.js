import { NextResponse } from "next/server";
import { getSession, isLoggedIn } from "@/lib/session";
import { getWeeklyStats } from "@/lib/stats";
import { SpotifyError } from "@/lib/spotify";
import { demoEnabled, getDemoStats } from "@/lib/demo";

export async function GET() {
  const session = await getSession();

  if (!isLoggedIn(session)) {
    if (demoEnabled()) {
      return NextResponse.json(await getDemoStats());
    }
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  try {
    return NextResponse.json(await getWeeklyStats(session));
  } catch (err) {
    if (err instanceof SpotifyError) {
      const status = err.status === 401 ? 401 : 502;
      return NextResponse.json({ error: err.message }, { status });
    }
    throw err;
  }
}
