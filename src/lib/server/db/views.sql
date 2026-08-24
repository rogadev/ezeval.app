-- Owner metrics views (convenience layer for ad-hoc querying in Neon Studio).
--
-- These are NOT managed by drizzle-kit push (which only syncs tables from
-- schema.ts). Apply this file by hand after a schema reset:
--   psql "$DATABASE_URL" -f src/lib/server/db/views.sql
-- The app's admin dashboard computes the same figures directly in
-- src/lib/server/metrics.ts, so it does not depend on these views existing.
--
-- Comped businesses (owner demo, internal) are excluded from customer,
-- paying, and active-usage figures so the numbers reflect real customers.

-- Per-business rollup: signup, subscription state, and activity signals.
CREATE OR REPLACE VIEW metrics_business_rollup AS
SELECT
	b.id,
	b.name,
	b.created_at,
	b.subscription_status,
	b.comped,
	(SELECT count(*) FROM "user" u WHERE u.business_id = b.id) AS users,
	(SELECT count(*) FROM evaluations e WHERE e.business_id = b.id) AS evaluations,
	(SELECT max(e.created_at) FROM evaluations e WHERE e.business_id = b.id) AS last_evaluation,
	(
		SELECT max(s.updated_at)
		FROM session s
		JOIN "user" u ON u.id = s.user_id
		WHERE u.business_id = b.id
	) AS last_login
FROM businesses b;

-- Signups per day (all history).
CREATE OR REPLACE VIEW metrics_signups_daily AS
SELECT to_char(created_at, 'YYYY-MM-DD') AS day, count(*)::int AS signups
FROM businesses
GROUP BY 1
ORDER BY 1;

-- Single-row platform KPIs.
CREATE OR REPLACE VIEW metrics_summary AS
WITH activity AS (
	SELECT s.user_id AS uid, s.updated_at AS ts FROM session s
	UNION ALL
	SELECT e.created_by AS uid, e.created_at AS ts FROM evaluations e WHERE e.created_by IS NOT NULL
),
real_activity AS (
	SELECT a.uid, a.ts
	FROM activity a
	JOIN "user" u ON u.id = a.uid
	JOIN businesses b ON b.id = u.business_id
	WHERE NOT b.comped
)
SELECT
	(SELECT count(*) FROM businesses)::int AS total_businesses,
	(SELECT count(*) FROM businesses WHERE comped)::int AS comped_businesses,
	(SELECT count(*) FROM businesses WHERE NOT comped)::int AS real_businesses,
	(SELECT count(*) FROM businesses WHERE subscription_status = 'active' AND NOT comped)::int AS paying,
	(SELECT count(*) FROM businesses WHERE subscription_status = 'trialing')::int AS trialing,
	(SELECT count(*) FROM businesses WHERE subscription_status = 'past_due')::int AS past_due,
	(SELECT count(*) FROM businesses WHERE subscription_status = 'canceled')::int AS canceled,
	(SELECT count(*) FROM businesses WHERE subscription_status IS NULL AND NOT comped)::int AS never_subscribed,
	(SELECT count(*) FROM businesses WHERE created_at >= now() - interval '7 days')::int AS signups_7d,
	(SELECT count(*) FROM businesses WHERE created_at >= now() - interval '30 days')::int AS signups_30d,
	(SELECT count(*) FROM evaluations)::int AS total_evaluations,
	(SELECT count(*) FROM evaluations WHERE created_at >= now() - interval '30 days')::int AS evaluations_30d,
	(SELECT coalesce(sum(total_cents), 0) FROM evaluations)::bigint AS total_quoted_cents,
	(SELECT count(DISTINCT uid) FROM real_activity WHERE ts >= now() - interval '1 day')::int AS dau,
	(SELECT count(DISTINCT uid) FROM real_activity WHERE ts >= now() - interval '7 days')::int AS wau,
	(SELECT count(DISTINCT uid) FROM real_activity WHERE ts >= now() - interval '30 days')::int AS mau;
