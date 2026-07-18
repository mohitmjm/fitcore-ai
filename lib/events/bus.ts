/**
 * Minimal in-process domain event bus.
 *
 * Decouples "something happened" (a signal was logged, a plan was generated, a streak hit a
 * milestone, a nudge is due) from "what we do about it" (send a WhatsApp message, award XP,
 * recompute memory). Subscribers register at startup; producers just emit.
 *
 * NOTE: in-process only — on serverless this resets per invocation. The interface is the durable
 * part; swap the implementation for a queue (e.g. QStash / SQS) when proactive messaging goes
 * live. See docs/architecture/06-whatsapp-architecture.md §4 and NEXT-STEPS.md.
 */

export type DomainEvent =
  | { type: 'signal.recorded'; clerkUserId: string; signalType: string }
  | { type: 'plan.generated'; clerkUserId: string }
  | { type: 'streak.milestone'; clerkUserId: string; streak: number }
  | { type: 'nudge.due'; clerkUserId: string; reason: string }
  | { type: 'weekly_story.generated'; clerkUserId: string; snapshotId: string; weekStart: string; version: number }
  | { type: 'weekly_story.viewed'; clerkUserId: string; snapshotId: string; weekStart: string }
  | { type: 'weekly_story.downloaded'; clerkUserId: string; snapshotId: string; weekStart: string }
  | { type: 'weekly_story.shared'; clerkUserId: string; snapshotId: string; weekStart: string; method: 'share' | 'copy' };

export type EventType = DomainEvent['type'];
export type EventHandler = (event: DomainEvent) => void | Promise<void>;

const handlers = new Set<EventHandler>();

/** Subscribe to all domain events. Returns an unsubscribe function. */
export function onEvent(handler: EventHandler): () => void {
  handlers.add(handler);
  return () => {
    handlers.delete(handler);
  };
}

/** Emit a domain event to all subscribers. Handler failures are isolated and logged. */
export async function emitEvent(event: DomainEvent): Promise<void> {
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (err) {
      console.warn(`[events] handler failed for ${event.type}`, err);
    }
  }
}
