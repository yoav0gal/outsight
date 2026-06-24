import { authkitMiddleware } from "@workos-inc/authkit-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

export default function middleware(request: NextRequest, event: NextFetchEvent) {
  if (process.env.NEXT_PUBLIC_ENABLE_LOGIN === "false") {
    return NextResponse.next();
  }
  return authkitMiddleware({
    middlewareAuth: {
      enabled: true,
      unauthenticatedPaths: [
        "/",
        "/sign-in",
        "/sign-up",
        "/join",
        "/p/:path*",
        "/api/auth/:path*",
        "/anonymous",
        "/anonymous/:path*",
        "/patient-auth",
        "/patient-auth/:path*",
        "/patient/:path*",
        "/admin",
        "/admin/:path*",
        "/api/admin/:path*",
        "/api/patient-auth/:path*",
      ],
    },
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

