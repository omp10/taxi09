import React, { Suspense, lazy } from 'react';

const TourDetails = lazy(() => import('./TourDetails'));
const DesktopPackageDetails = lazy(() => import('./DesktopPackageDetails'));

/** Breakpoint split for /taxi/user/tours/details. */
function TourDetailsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <TourDetails />
      </div>

      <div className="hidden lg:block">
        <DesktopPackageDetails scope="domestic" />
      </div>
    </Suspense>
  );
}

export default TourDetailsRoute;
