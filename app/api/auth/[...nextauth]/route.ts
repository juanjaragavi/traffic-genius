/**
 * TrafficGenius — NextAuth API Route Handler
 */

import { handlers } from "@/auth";
import type { NextRequest } from "next/server";

export function GET(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> },
) {
  return (handlers.GET as (req: NextRequest) => Promise<Response>)(request);
}

export function POST(
  request: NextRequest,
  _context: { params: Promise<{ nextauth: string[] }> },
) {
  return (handlers.POST as (req: NextRequest) => Promise<Response>)(request);
}
