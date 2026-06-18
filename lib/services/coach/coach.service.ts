import { z } from 'zod';
import type { AuthContext } from '@/lib/core/context';
import { OwnedRepository, getCollection, type OwnedDoc } from '@/lib/db/repository';
import { runAITask } from '@/lib/ai/router';
import { MemoryService } from '@/lib/services/memory/memory.service';

interface CoachMessageDoc extends OwnedDoc {
  role: 'user' | 'coach';
  text: string;
}

const COLL = 'coach_messages';
const messagesRepo = new OwnedRepository<CoachMessageDoc>(COLL);

export const AskInput = z.object({ message: z.string().min(1).max(2000) });

/**
 * AI coach chat. Injects the deterministic Coach Brief (memory) into the prompt, routes to the
 * AI provider (with deterministic fallback), and persists both turns. See docs/architecture/02.
 */
export async function askCoach(ctx: AuthContext, raw: unknown) {
  const { message } = AskInput.parse(raw);

  const brief = await MemoryService.buildCoachBrief(ctx.clerkUserId);
  const prompt = `You are FitCore AI — a warm, concise, no-nonsense fitness & nutrition coach. Reply in 2-4 short sentences. Coach brief about this user:\n${brief}\n\nUser: ${message}`;

  const reply = await runAITask('coach_chat', prompt);

  await messagesRepo.create(ctx.clerkUserId, { role: 'user', text: message });
  await messagesRepo.create(ctx.clerkUserId, { role: 'coach', text: reply });

  await MemoryService.recordSignal({
    clerkUserId: ctx.clerkUserId,
    source: ctx.source === 'whatsapp' ? 'whatsapp' : 'app',
    type: 'message',
    payload: { length: message.length },
    occurredAt: new Date(),
  });

  return { reply };
}

/** Full chat history (oldest → newest), capped. */
export async function getHistory(clerkUserId: string, limit = 100): Promise<CoachMessageDoc[]> {
  const msgs = await messagesRepo.list(clerkUserId);
  msgs.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return ta - tb;
  });
  return msgs.slice(-limit);
}

/** Clear the user's chat history. */
export async function clearHistory(clerkUserId: string): Promise<void> {
  const coll = await getCollection<CoachMessageDoc>(COLL);
  await coll.deleteMany({ clerkUserId });
}
