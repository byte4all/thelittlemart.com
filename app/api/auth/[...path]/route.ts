import { checkBotId } from "botid/server";
import { auth } from "@/lib/auth/server";

const handlers = auth.handler();

type RouteContext = { params: Promise<{ path: string[] }> };

// GET (session reads, OAuth callbacks) and PUT/DELETE/PATCH are left
// unguarded — BotID only challenges POST to /api/auth/* (see
// instrumentation-client.ts), and a server check on other verbs would have
// no token to verify anyway.
export const { GET, PUT, DELETE, PATCH } = handlers;

export async function POST(request: Request, ctx: RouteContext) {
  const verification = await checkBotId();
  if (verification.isBot) {
    return new Response("Access denied", { status: 403 });
  }
  return handlers.POST(request, ctx);
}
