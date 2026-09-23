const DEMO_ADMIN_FLAG_KEY = 'sushi_admin_demo_access';
const DEMO_ADMIN_EMAIL_KEY = 'sushi_admin_demo_email';

/**
 * Client-side only "Quick Demo Admin Access" flag for development/testing.
 * This never touches Supabase auth — it's a session-scoped bypass so the
 * admin panel's real login/role-check flow can be tested without needing a
 * seeded admin account. Cleared on sign-out.
 */
export function isDemoAdminActive(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(DEMO_ADMIN_FLAG_KEY) === 'true';
  } catch {
    return false;
  }
}

export function activateDemoAdmin(email?: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(DEMO_ADMIN_FLAG_KEY, 'true');
    if (email) {
      sessionStorage.setItem(DEMO_ADMIN_EMAIL_KEY, email);
    }
  } catch {
    // ignore
  }
}

export function getDemoAdminEmail(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(DEMO_ADMIN_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function clearDemoAdmin(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(DEMO_ADMIN_FLAG_KEY);
    sessionStorage.removeItem(DEMO_ADMIN_EMAIL_KEY);
  } catch {
    // ignore
  }
}

