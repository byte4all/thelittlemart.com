import { NextResponse } from "next/server";
import { authAdmin, isAdminAuthFailure } from "@/lib/auth";

export async function requireAdminApi(request: Request): Promise<NextResponse | null> {
  const result = await authAdmin(request);
  if (isAdminAuthFailure(result)) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: result.status }
    );
  }
  return null;
}
