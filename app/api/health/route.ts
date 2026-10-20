import { NextResponse } from "next/server";
export function GET() {
  return NextResponse.json({
    application: "SivirinIA",
    status: "ok",
    version: "0.1.0",
  });
}
