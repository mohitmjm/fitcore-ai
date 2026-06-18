import type { MessagingChannel, OutboundMessage, ChannelName } from './types';

/**
 * Offline channel. Always available; logs outbound messages instead of sending them. Used in
 * dev and as the fallback when no real channel has credentials.
 */
export class MockChannel implements MessagingChannel {
  readonly name: ChannelName = 'mock';
  readonly available = true;

  async send(msg: OutboundMessage): Promise<void> {
    console.log(`[channel:mock] -> ${msg.to}: ${msg.text}`);
  }
}
