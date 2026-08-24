import { and, eq, gte, sql } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { businesses, evaluations, session, user } from '$lib/server/db/schema';
import { monthlyRecurringRevenueCents } from '$lib/server/billing';
import {
	estimatedStripeFeesCents,
	totalFixedCostsCents,
	MONTHLY_FIXED_COSTS_CENTS,
	type FixedCost
} from '$lib/server/costs';

/**
 * Platform-wide metrics for the owner dashboard. This reads across every
 * business (no tenant filter), so it must only ever be reached behind
 * `requireOwner`. Comped businesses (the owner demo, internal accounts) are
 * excluded from paying-user, revenue, and active-usage figures so the numbers
 * reflect real customers, not our own showcase account.
 */
export type Metrics = {
	generatedAt: string;
	businesses: {
		total: number;
		real: number;
		comped: number;
		activePaying: number;
		trialing: number;
		pastDue: number;
		canceled: number;
		neverSubscribed: number;
		signups7d: number;
		signups30d: number;
	};
	activity: { dau: number; wau: number; mau: number };
	evaluations: { total: number; last30d: number; totalQuotedCents: number };
	signupsDaily: { date: string; count: number }[];
	revenue: {
		mrrCents: number | null;
		fixedCostsCents: number;
		stripeFeesCents: number;
		totalCostsCents: number;
		netCents: number | null;
		fixedCostLines: FixedCost[];
	};
};

const WINDOW_30D = sql`now() - interval '30 days'`;

export async function computeMetrics(): Promise<Metrics> {
	const [biz] = await db
		.select({
			total: sql<number>`count(*)::int`,
			comped: sql<number>`count(*) filter (where ${businesses.comped})::int`,
			activePaying: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'active' and not ${businesses.comped})::int`,
			trialing: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'trialing')::int`,
			pastDue: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'past_due')::int`,
			canceled: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} = 'canceled')::int`,
			neverSubscribed: sql<number>`count(*) filter (where ${businesses.subscriptionStatus} is null and not ${businesses.comped})::int`,
			signups7d: sql<number>`count(*) filter (where ${businesses.createdAt} >= now() - interval '7 days')::int`,
			signups30d: sql<number>`count(*) filter (where ${businesses.createdAt} >= now() - interval '30 days')::int`
		})
		.from(businesses);

	const [ev] = await db
		.select({
			total: sql<number>`count(*)::int`,
			last30d: sql<number>`count(*) filter (where ${evaluations.createdAt} >= now() - interval '30 days')::int`,
			totalQuotedCents: sql<number>`coalesce(sum(${evaluations.totalCents}), 0)::bigint`
		})
		.from(evaluations);

	const dayExpr = sql<string>`to_char(${businesses.createdAt}, 'YYYY-MM-DD')`;
	const signupsDaily = await db
		.select({ date: dayExpr, count: sql<number>`count(*)::int` })
		.from(businesses)
		.where(gte(businesses.createdAt, WINDOW_30D))
		.groupBy(dayExpr)
		.orderBy(dayExpr);

	// Activity = any login (session last-seen) or evaluation authored in the
	// window, by a user in a real (non-comped) business. Rows are small and
	// bounded by the 30-day window; DAU/WAU/MAU are folded in memory.
	const sessionActivity = await db
		.select({ uid: session.userId, ts: session.updatedAt })
		.from(session)
		.innerJoin(user, eq(user.id, session.userId))
		.innerJoin(businesses, eq(businesses.id, user.businessId))
		.where(and(gte(session.updatedAt, WINDOW_30D), eq(businesses.comped, false)));

	const evalActivity = await db
		.select({ uid: evaluations.createdBy, ts: evaluations.createdAt })
		.from(evaluations)
		.innerJoin(user, eq(user.id, evaluations.createdBy))
		.innerJoin(businesses, eq(businesses.id, user.businessId))
		.where(and(gte(evaluations.createdAt, WINDOW_30D), eq(businesses.comped, false)));

	const now = Date.now();
	const events = [...sessionActivity, ...evalActivity]
		.filter((r): r is { uid: string; ts: Date } => Boolean(r.uid && r.ts))
		.map((r) => ({ uid: r.uid, ts: new Date(r.ts).getTime() }));
	const activeWithin = (days: number) =>
		new Set(events.filter((e) => e.ts >= now - days * 86_400_000).map((e) => e.uid)).size;
	const activity = { dau: activeWithin(1), wau: activeWithin(7), mau: activeWithin(30) };

	const mrrCents = await monthlyRecurringRevenueCents();
	const fixedCostsCents = totalFixedCostsCents();
	const stripeFeesCents = estimatedStripeFeesCents(mrrCents ?? 0, biz.activePaying);
	const totalCostsCents = fixedCostsCents + stripeFeesCents;
	const netCents = mrrCents === null ? null : mrrCents - totalCostsCents;

	return {
		generatedAt: new Date().toISOString(),
		businesses: { ...biz, real: biz.total - biz.comped },
		activity,
		evaluations: { ...ev, totalQuotedCents: Number(ev.totalQuotedCents) },
		signupsDaily,
		revenue: {
			mrrCents,
			fixedCostsCents,
			stripeFeesCents,
			totalCostsCents,
			netCents,
			fixedCostLines: MONTHLY_FIXED_COSTS_CENTS
		}
	};
}
