import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { UsersService } from '@/lib/services/users/users.service';

export const runtime = 'nodejs';

interface ClerkEmail {
  email_address: string;
}
interface ClerkUserData {
  id: string;
  email_addresses?: ClerkEmail[];
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  image_url?: string;
}
interface ClerkEvent {
  type: string;
  data: ClerkUserData;
}

/**
 * Clerk → MongoDB sync. Verifies the Svix signature, then upserts/soft-deletes the user
 * profile. See docs/architecture/07-clerk-auth.md §5.
 */
export async function POST(req: Request): Promise<Response> {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) return new Response('Webhook secret not configured', { status: 500 });

  const h = await headers();
  const svixId = h.get('svix-id');
  const svixTimestamp = h.get('svix-timestamp');
  const svixSignature = h.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing Svix headers', { status: 400 });
  }

  const body = await req.text();
  let evt: ClerkEvent;
  try {
    evt = new Webhook(secret).verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkEvent;
  } catch {
    return new Response('Invalid signature', { status: 400 });
  }

  if (evt.type === 'user.created' || evt.type === 'user.updated') {
    const u = evt.data;
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(' ') || u.username || 'Athlete';
    await UsersService.upsertFromClerk({
      clerkUserId: u.id,
      email: u.email_addresses?.[0]?.email_address ?? '',
      name,
      imageUrl: u.image_url,
    });
  } else if (evt.type === 'user.deleted') {
    if (evt.data?.id) await UsersService.softDelete(evt.data.id);
  }

  return new Response('ok', { status: 200 });
}
