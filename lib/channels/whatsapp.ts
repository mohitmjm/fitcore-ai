import type { MessagingChannel, OutboundMessage, ChannelName } from './types';
import { fetchWithTimeout } from '@/lib/ai/providers/types';

/**
 * WhatsApp Cloud API (Meta Graph) channel.
 *
 * Activates the moment WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID are present — no code change.
 * Until then it reports `available = false` and the registry routes to the mock channel, so the
 * inbound processor / event system are fully testable offline.
 */
export class WhatsAppChannel implements MessagingChannel {
  readonly name: ChannelName = 'whatsapp';

  get available(): boolean {
    return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  async send(msg: OutboundMessage): Promise<void> {
    const token = process.env.WHATSAPP_TOKEN || '';
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    const version = process.env.WHATSAPP_API_VERSION || 'v21.0';
    if (!token || !phoneId) throw new Error('WhatsApp not configured');

    const res = await fetchWithTimeout(`https://graph.facebook.com/${version}/${phoneId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: msg.to,
        type: 'text',
        text: { preview_url: false, body: msg.text },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`WhatsApp ${res.status}: ${errText}`);
    }
  }
}
