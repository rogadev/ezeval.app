import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

/**
 * Billing is optional in development: with no STRIPE_SECRET_KEY the app runs
 * fully unlocked and the billing page explains the unconfigured state.
 */
export const billingEnabled = () => Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID);

let client: Stripe | null = null;
export function stripe(): Stripe {
	if (!client) {
		if (!env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set');
		client = new Stripe(env.STRIPE_SECRET_KEY);
	}
	return client;
}

const appUrl = () => env.PUBLIC_APP_URL || 'http://localhost:5173';

export async function createCheckoutSession(options: {
	businessId: string;
	businessName: string;
	customerEmail: string;
	stripeCustomerId: string | null;
}): Promise<string> {
	const session = await stripe().checkout.sessions.create({
		mode: 'subscription',
		line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
		...(options.stripeCustomerId
			? { customer: options.stripeCustomerId }
			: { customer_email: options.customerEmail }),
		metadata: { businessId: options.businessId },
		subscription_data: { metadata: { businessId: options.businessId } },
		success_url: `${appUrl()}/app/billing?subscribed=1`,
		cancel_url: `${appUrl()}/app/billing`
	});
	if (!session.url) throw new Error('Stripe did not return a checkout URL');
	return session.url;
}

export async function createPortalSession(stripeCustomerId: string): Promise<string> {
	const session = await stripe().billingPortal.sessions.create({
		customer: stripeCustomerId,
		return_url: `${appUrl()}/app/billing`
	});
	return session.url;
}

export type AccessState = 'ok' | 'trial' | 'locked';

/**
 * Subscription gating (resolved spec open question #4):
 * active/trialing -> ok; past_due -> ok (Stripe Smart Retries grace, banner
 * shown); never-subscribed inside the 14-day app trial -> trial;
 * everything else -> locked to the billing page.
 */
export function accessState(business: {
	subscriptionStatus: string | null;
	trialEndsAt: Date | null;
}): AccessState {
	if (!billingEnabled()) return 'ok';
	const status = business.subscriptionStatus;
	if (status === 'active' || status === 'trialing' || status === 'past_due') return 'ok';
	if (!status && business.trialEndsAt && business.trialEndsAt.getTime() > Date.now()) {
		return 'trial';
	}
	return 'locked';
}
