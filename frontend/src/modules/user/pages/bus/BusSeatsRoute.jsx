import React, { Suspense, lazy } from 'react';

const BusSeats = lazy(() => import('./BusSeats'));
const DesktopBusSeats = lazy(() => import('./DesktopBusSeats'));

/**
 * Breakpoint split. BusSeats keeps the whole mobile experience untouched.
 */
function BusSeatsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <BusSeats />
      </div>

      <div className="hidden lg:block">
        <DesktopBusSeats />
      </div>
    </Suspense>
  );
}

export default BusSeatsRoute;
