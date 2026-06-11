import { error, redirect } from '@sveltejs/kit';

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
