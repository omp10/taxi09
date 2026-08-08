import React, { Suspense, lazy } from 'react';
import { useSearchParams } from 'react-router-dom';

const BikeRentalHome = lazy(() => import('./BikeRentalHome'));
const DesktopSelfDrive = lazy(() => import('./DesktopSelfDrive'));
const DesktopCarList = lazy(() => import('./DesktopCarList'));

/**
 * Splits the Self Drive landing by breakpoint, the same way Home.jsx does for
 * the user home. BikeRentalHome owns the whole mobile experience and is not
 * touched by the desktop layout.
 */
function RentalHomePage() {
  // `?search=true` is the vehicle-results state: BikeRentalHome renders it on
  // mobile, DesktopCarList on desktop.
  const [searchParams] = useSearchParams();
  const isSearching = searchParams.get('search') === 'true';

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <BikeRentalHome />
      </div>

      <div className="hidden lg:block">
        {isSearching ? <DesktopCarList /> : <DesktopSelfDrive />}
      </div>
    </Suspense>
  );
}

export default RentalHomePage;
