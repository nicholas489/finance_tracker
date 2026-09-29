import { NextResponse, type NextRequest } from "next/server";

// Routes that need a signed-in user. Add new private sections here.
const protectedPrefixes = ["/dashboard"];

// Optimistic check only: it looks for the cookie, not a valid session.
// The real check against the database happens in lib/dal.ts.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !request.cookies.has("session")) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
