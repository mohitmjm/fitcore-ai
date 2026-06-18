import type { AuthContext } from '@/lib/core/context';
import { getCollection } from '@/lib/db/repository';
import type { InboundMessage } from '@/lib/channels/types';
import { getChannel } from '@/lib/channels/registry';
import { askCoach } from '@/lib/services/coach/coach.service';
import { emitEvent } from '@/lib/events/bus';

/** Maps an external channel identity (e.g. a WhatsApp phone number) to an app user. */
interface ChannelContact {
  clerkUserId: string;
  channel: string;
  externalId: string;
}

async function resolveUser(channel: string, externalId: string): Promise<string | null> {
  const coll = await getCollection<ChannelContact>('channel_contacts');
  const row = await coll.findOne({ channel, externalId });
  return row?.clerkUserId ?? null;
}

const LINK_PROMPT =
  "Hi! I'm your FitCore AI coach 💪 Link your number in the app (Profile → Connect WhatsApp) " +
  "and I'll start coaching you right here — workouts, nutrition, and daily nudges.";

/**
 * Channel-agnostic inbound handler: normalize → resolve user → run the same coach brain used by
 * the web app → reply on the originating channel. This is the seam WhatsApp (and later
 * Telegram/SMS/voice) plug into; the coaching logic is shared, not duplicated.
 */
export async function processInbound(msg: InboundMessage): Promise<string> {
  const clerkUserId = msg.clerkUserId ?? (await resolveUser(msg.channel, msg.from));
  const channel = getChannel(msg.channel);

  if (!clerkUserId) {
    await channel.send({ to: msg.from, text: LINK_PROMPT });
    return LINK_PROMPT;
  }

  const ctx: AuthContext = { clerkUserId, role: 'user', plan: 'free', source: 'whatsapp' };
  const { reply } = await askCoach(ctx, { message: msg.text });

  await channel.send({ to: msg.from, text: reply });
  await emitEvent({ type: 'signal.recorded', clerkUserId, signalType: 'message' });

  return reply;
}
