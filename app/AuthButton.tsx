"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

// Header auth control. Signed in → Clerk's <UserButton> (real avatar). Signed
// out → a placeholder avatar icon that opens the sign-in modal on click. Renders
// a static placeholder while Clerk hydrates to avoid a layout shift.
export function AuthButton() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <span className="avatar avatar-placeholder" aria-hidden />;
  if (isSignedIn) return <UserButton afterSignOutUrl="/" />;
  return (
    <SignInButton mode="modal" forceRedirectUrl="/">
      <button type="button" className="avatar avatar-placeholder" aria-label="Sign in" title="Sign in">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.3 0-8 1.7-8 5v1h16v-1c0-3.3-4.7-5-8-5Z"
            fill="currentColor"
          />
        </svg>
      </button>
    </SignInButton>
  );
}
