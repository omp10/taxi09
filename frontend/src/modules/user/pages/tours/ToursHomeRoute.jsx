import React, { Suspense, lazy } from 'react';

const ToursHome = lazy(() => import('./ToursHome'));
const DesktopTours = lazy(() => import('./DesktopTours'));

/**
 * Breakpoint split for /taxi/user/tours. ToursHome keeps the whole mobile
 * experience; desktop gets the packages layout.
 */
function ToursHomeRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <ToursHome />
      </div>

      <div className="hidden lg:block">
        <DesktopTours />
      </div>
    </Suspense>
  );
}

export default ToursHomeRoute;
