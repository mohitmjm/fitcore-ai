import { NextResponse } from 'next/server';
import type { InboundMessage } from '@/lib/channels/types';
import { processInbound } from '@/lib/services/messaging/inbound.processor';

export const runtime = 'nodejs';

// ---- Minimal typings for the WhatsApp Cloud API webhook payload (no `any`) ----------------
interface WaTextMessage {
  from: string;
  id?: string;
  type?: string;
  text?: { body?: string };
}
interface WaChangeValue {
  messages?: WaTextMessage[];
}
interface WaChange {
  value?: WaChangeValue;
}
interface WaEntry {
  changes?: WaChange[];
}
interface WaWebhookBody {
  entry?: WaEntry[];
}

/**
 * Meta webhook verification handshake. Configure WHATSAPP_VERIFY_TOKEN to match the value set in
 * the Meta dashboard; until then verification is refused (safe default).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  const verify = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && verify && token === verify) {
    return new NextResponse(challenge ?? '', { status: 200 });
  }
  return new NextResponse('forbidden', { status: 403 });
}

function normalize(body: WaWebhookBody): InboundMessage[] {
  const out: InboundMessage[] = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const m of change.value?.messages ?? []) {
        const text = m.text?.body;
        if (m.from && typeof text === 'string') {
          out.push({ channel: 'whatsapp', from: m.from, text, receivedAt: new Date(), raw: m });
        }
      }
    }
  }
  return out;
}

/**
 * Inbound messages. Always responds 200 (even on internal error) so Meta doesn't retry-storm;
 * failures are logged for inspection.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as WaWebhookBody;
    const messages = normalize(body);
    await Promise.all(messages.map((m) => processInbound(m)));
  } catch (err) {
    console.error('[whatsapp webhook] processing error', err);
  }
  return NextResponse.json({ received: true });
}
