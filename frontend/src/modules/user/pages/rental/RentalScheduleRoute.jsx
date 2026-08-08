import React, { Suspense, lazy } from 'react';

const RentalSchedule = lazy(() => import('./RentalSchedule'));
const DesktopRentalExtras = lazy(() => import('./DesktopRentalExtras'));

/**
 * Breakpoint split for /taxi/user/rental/schedule. RentalSchedule keeps the
 * whole mobile flow; desktop gets the Extra Options step.
 */
function RentalScheduleRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <RentalSchedule />
      </div>

      <div className="hidden lg:block">
        <DesktopRentalExtras />
      </div>
    </Suspense>
  );
}

export default RentalScheduleRoute;
