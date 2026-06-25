import { NextResponse } from "next/server";
import { getAuthUserAndSync } from "@/lib/auth";

/**
 * GET /api/auth/sync
 * Syncs the current Neon Auth user to our database. Call this after sign-in/sign-up
 * (e.g. on app load when user is logged in) so the user exists in our users table.
 */
export async function GET(request: Request) {
  try {
    const user = await getAuthUserAndSync(request);
    if (!user) {
      return NextResponse.json({ success: true, user: null });
    }
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    });
  } catch (error) {
    console.error("Auth sync error:", error);
    return NextResponse.json(
      { success: false, error: "Sync failed" },
      { status: 500 }
    );
  }
}
