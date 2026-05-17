import { NextResponse } from "next/server";
import { CANONICAL_ORIGIN, SESSION_COOKIE } from "@/lib/session";

export async function GET() {
  const response = NextResponse.redirect(new URL("/", CANONICAL_ORIGIN));

  response.cookies.set(SESSION_COOKIE, "", {
    path: "/",
    expires: new Date(0),
  });

  return response;
}
