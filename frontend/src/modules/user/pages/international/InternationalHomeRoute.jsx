import React, { Suspense, lazy } from 'react';

const InternationalHome = lazy(() => import('./InternationalHome'));
const DesktopInternational = lazy(() => import('./DesktopInternational'));

/**
 * Breakpoint split for /taxi/user/international. InternationalHome keeps the
 * whole mobile experience; desktop gets the packages layout.
 */
function InternationalHomeRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <InternationalHome />
      </div>

      <div className="hidden lg:block">
        <DesktopInternational />
      </div>
    </Suspense>
  );
}

export default InternationalHomeRoute;
