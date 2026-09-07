import { NextResponse } from "next/server";
import { allowDemoPay, isBillplzConfigured } from "@/lib/billplz";

export async function GET() {
  return NextResponse.json({
    billplz: isBillplzConfigured(),
    demo: allowDemoPay(),
  });
}
