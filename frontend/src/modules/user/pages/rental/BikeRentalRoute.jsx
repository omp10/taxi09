import React, { Suspense, lazy } from 'react';
import BikeCategoriesSelection from './BikeCategoriesSelection';

const DesktopBikeRental = lazy(() => import('./DesktopBikeRental'));

/**
 * Bike rental. The phone keeps its category-first flow; the desktop shows the
 * full catalogue with the rental plan alongside it.
 */
const BikeRentalRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <BikeCategoriesSelection />
    </div>
    <div className="hidden lg:block">
      <DesktopBikeRental />
    </div>
  </Suspense>
);

export default BikeRentalRoute;
