import React, { Suspense, lazy } from 'react';

const BusList = lazy(() => import('./BusList'));
const DesktopBusList = lazy(() => import('./DesktopBusList'));

/**
 * Breakpoint split. BusList keeps the whole mobile experience untouched.
 */
function BusListRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <BusList />
      </div>

      <div className="hidden lg:block">
        <DesktopBusList />
      </div>
    </Suspense>
  );
}

export default BusListRoute;
