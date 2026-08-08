import React, { Suspense, lazy } from 'react';

const HotelHome = lazy(() => import('./HotelHome'));
const DesktopHotelList = lazy(() => import('./DesktopHotelList'));

/**
 * Breakpoint split for /taxi/user/hotel. HotelHome keeps the whole mobile
 * experience; desktop gets the search results layout.
 */
function HotelHomeRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <HotelHome />
      </div>

      <div className="hidden lg:block">
        <DesktopHotelList />
      </div>
    </Suspense>
  );
}

export default HotelHomeRoute;
