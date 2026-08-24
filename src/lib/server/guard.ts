import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export type SessionUser = NonNullable<App.Locals['user']>;

/** A session user that is fully attached to a business. */
export type TenantUser = SessionUser & { businessId: string; role: Role };

export type Role = 'admin' | 'estimator' | 'technician';

/** Redirects to /login unless a user with a business is signed in. */
export function requireUser(locals: App.Locals): TenantUser {
	const user = locals.user;
	if (!user) redirect(303, '/login');
	if (!user.businessId) {
		// Signup was interrupted between user creation and business attachment;
		// there is no recoverable state worth keeping.
		redirect(303, '/signup?incomplete=1');
	}
	return user as TenantUser;
}

export function requireAdmin(locals: App.Locals): TenantUser {
	const user = requireUser(locals);
	if (user.role !== 'admin') error(403, 'Admin access required');
	return user;
}

export function isAdmin(user: { role?: string | null }): boolean {
	return user.role === 'admin';
}

/**
 * The single platform owner (super-admin), identified by email. This is a
 * cross-tenant role above the per-business `admin`: it gates the internal
 * metrics dashboard, which reads every business's data. Configurable via
 * OWNER_EMAIL; defaults to the founder's account.
 */
export function ownerEmail(): string {
	return (env.OWNER_EMAIL || 'ryanroga@gmail.com').trim().toLowerCase();
}

export function isOwner(user: { email?: string | null }): boolean {
	return Boolean(user.email && user.email.trim().toLowerCase() === ownerEmail());
}

/** Redirects like requireUser, then 404s anyone who is not the platform owner. */
export function requireOwner(locals: App.Locals): TenantUser {
	const user = requireUser(locals);
	// 404 rather than 403 so the route's existence isn't advertised.
	if (!isOwner(user)) error(404, 'Not found');
	return user;
}
