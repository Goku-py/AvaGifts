import { NextResponse } from "next/server";
import { enquirySchema } from "@/lib/enquiry";

const SIMULATED_PROCESSING_MS = 600;

/**
 * POST /api/enquiry
 *
 * Validates the payload with the shared enquiry schema, simulates
 * processing latency, and acknowledges. Re-validating on the server means
 * the client can never bypass validation.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = enquirySchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    return NextResponse.json(
      { ok: false, error: "Validation failed.", fieldErrors },
      { status: 400 },
    );
  }

  // Simulate processing (queue write, provider round-trip, …).
  await new Promise((resolve) => setTimeout(resolve, SIMULATED_PROCESSING_MS));

  // TODO(email-integration): forward `parsed.data` to the email/CRM provider
  // (e.g. Resend transactional email + CRM entry) once credentials are
  // provisioned. Keep this route as the single ingestion point.

  return NextResponse.json({ ok: true });
}
