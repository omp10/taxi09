import React, { Suspense, lazy } from 'react';

const BusHome = lazy(() => import('./BusHome'));
const DesktopBus = lazy(() => import('./DesktopBus'));

/**
 * Breakpoint split for /taxi/user/bus. BusHome keeps the whole mobile
 * experience; desktop gets search plus inline results.
 */
function BusHomeRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <BusHome />
      </div>

      <div className="hidden lg:block">
        <DesktopBus />
      </div>
    </Suspense>
  );
}

export default BusHomeRoute;
