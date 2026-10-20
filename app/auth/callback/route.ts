import { resolveAppOrigin } from "@/lib/origin";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  let origin: string;
  try {
    origin = resolveAppOrigin(process.env.APP_URL, request.headers.get("host"));
  } catch {
    return NextResponse.json(
      {
        error:
          "O endereço público da aplicação precisa ser configurado pelo administrador.",
      },
      { status: 503 },
    );
  }
  const code = url.searchParams.get("code");
  const next =
    url.searchParams.get("next") === "/reset-password"
      ? "/reset-password"
      : "/workspace";
  if (code) {
    const db = await supabase();
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=callback", origin));
}
