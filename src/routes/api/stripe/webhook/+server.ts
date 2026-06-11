import { error, json } from '@sveltejs/kit';
import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { businesses } from '$lib/server/db/schema';
import { billingEnabled, stripe } from '$lib/server/billing';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	if (!billingEnabled() || !env.STRIPE_WEBHOOK_SECRET) error(503, 'Billing not configured');

	const payload = await request.text();
	const signature = request.headers.get('stripe-signature');
	if (!signature) error(400, 'Missing signature');

	let event: Stripe.Event;
	try {
		event = await stripe().webhooks.constructEventAsync(
			payload,
			signature,
			env.STRIPE_WEBHOOK_SECRET
		);
	} catch {
		error(400, 'Invalid signature');
	}

	switch (event.type) {
		case 'checkout.session.completed': {
			const session = event.data.object;
			const businessId = session.metadata?.businessId;
			if (businessId && session.customer && session.subscription) {
				await db
					.update(businesses)
					.set({
						stripeCustomerId: String(session.customer),
						stripeSubscriptionId: String(session.subscription),
						subscriptionStatus: 'active'
					})
					.where(eq(businesses.id, businessId));
			}
			break;
		}
		case 'customer.subscription.created':
		case 'customer.subscription.updated':
		case 'customer.subscription.deleted': {
			const subscription = event.data.object;
			const businessId = subscription.metadata?.businessId;
			const status =
				event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status;
			if (businessId) {
				await db
					.update(businesses)
					.set({
						subscriptionStatus: status,
						stripeSubscriptionId: subscription.id,
						stripeCustomerId: String(subscription.customer)
					})
					.where(eq(businesses.id, businessId));
			} else {
				// Fallback correlation by customer id for events without metadata.
				await db
					.update(businesses)
					.set({ subscriptionStatus: status, stripeSubscriptionId: subscription.id })
					.where(eq(businesses.stripeCustomerId, String(subscription.customer)));
			}
			break;
		}
		default:
			break;
	}

	return json({ received: true });
};
