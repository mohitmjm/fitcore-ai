import { Errors } from './errors';

export type Role = 'user' | 'trainer' | 'nutritionist' | 'admin';
export type Plan = 'free' | 'premium' | 'pro';
export type Source = 'web' | 'mobile' | 'whatsapp' | 'system';

/**
 * The auth context passed to every service call. Built once at the entrypoint (Clerk on
 * web/mobile, wa_contacts on WhatsApp) and threaded down. See docs/architecture/04 §2.2.
 */
export interface AuthContext {
  clerkUserId: string;
  role: Role;
  plan: Plan;
  source: Source;
}

const PLAN_RANK: Record<Plan, number> = { free: 0, premium: 1, pro: 2 };

export function requireRole(ctx: AuthContext, ...roles: Role[]): void {
  if (!roles.includes(ctx.role)) throw Errors.forbidden();
}

export function requirePlan(ctx: AuthContext, min: Plan): void {
  if (PLAN_RANK[ctx.plan] < PLAN_RANK[min]) throw Errors.planLimit();
}
