import React, { Suspense, lazy } from 'react';

const WithDriverHome = lazy(() => import('../WithDriverHome'));
const DesktopWithDriver = lazy(() => import('./DesktopWithDriver'));

/**
 * Breakpoint split for /taxi/user/with-driver. WithDriverHome keeps the whole
 * mobile experience; desktop gets the search + driver list.
 */
function WithDriverRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <WithDriverHome />
      </div>

      <div className="hidden lg:block">
        <DesktopWithDriver />
      </div>
    </Suspense>
  );
}

export default WithDriverRoute;
