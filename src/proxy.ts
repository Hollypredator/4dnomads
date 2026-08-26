import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

// Cookie refresh only. See src/utils/supabase/proxy.ts for why authorization
// does not live here.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
