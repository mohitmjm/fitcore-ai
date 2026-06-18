/**
 * Channel-agnostic messaging layer.
 *
 * FitCore is "WhatsApp-first" by vision, but the coaching brain must not care which channel a
 * message came from. Every inbound message is normalized into InboundMessage; every reply is an
 * OutboundMessage sent through a MessagingChannel. Adding Telegram/SMS later = one new channel.
 *
 * See docs/architecture/06-whatsapp-architecture.md.
 */

export type ChannelName = 'whatsapp' | 'web' | 'mock';

export interface InboundMessage {
  channel: ChannelName;
  /** External sender id (e.g. WhatsApp phone number in E.164). */
  from: string;
  /** Resolved app user, if the sender is linked. */
  clerkUserId?: string;
  text: string;
  receivedAt: Date;
  /** Original provider payload, for auditing/debugging. */
  raw?: unknown;
}

export interface OutboundMessage {
  to: string;
  text: string;
}

export interface MessagingChannel {
  readonly name: ChannelName;
  /** True when the channel has the credentials it needs RIGHT NOW (reads env live). */
  readonly available: boolean;
  /** Deliver a message. MUST throw on failure so callers can fall back / retry. */
  send(msg: OutboundMessage): Promise<void>;
}
