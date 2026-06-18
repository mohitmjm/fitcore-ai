import type { ChannelName, MessagingChannel } from './types';
import { WhatsAppChannel } from './whatsapp';
import { MockChannel } from './mock';

const whatsapp = new WhatsAppChannel();
const mock = new MockChannel();

/** Resolve a channel by name, falling back to the mock channel when the real one isn't ready. */
export function getChannel(name?: ChannelName): MessagingChannel {
  if (name === 'whatsapp' && whatsapp.available) return whatsapp;
  return mock;
}

/** The preferred outbound channel for proactive messages (nudges, weekly stories). */
export function defaultChannel(): MessagingChannel {
  return whatsapp.available ? whatsapp : mock;
}

/** Diagnostics for an admin/health route — which channels have credentials. */
export function channelStatus(): { name: ChannelName; available: boolean }[] {
  return [
    { name: 'whatsapp', available: whatsapp.available },
    { name: 'mock', available: true },
  ];
}
