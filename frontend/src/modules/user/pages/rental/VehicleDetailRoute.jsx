import React, { Suspense, lazy } from 'react';

const RentalVehicleDetail = lazy(() => import('./RentalVehicleDetail'));
const DesktopVehicleDetail = lazy(() => import('./DesktopVehicleDetail'));

/**
 * Breakpoint split for /taxi/user/rental/vehicle, matching RentalHome. The
 * mobile detail page is left exactly as it was.
 */
function VehicleDetailRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <RentalVehicleDetail />
      </div>

      <div className="hidden lg:block">
        <DesktopVehicleDetail />
      </div>
    </Suspense>
  );
}

export default VehicleDetailRoute;
