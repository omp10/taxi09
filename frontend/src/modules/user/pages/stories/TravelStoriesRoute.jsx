import React, { Suspense, lazy } from 'react';

const MobileTravelStories = lazy(() => import('./MobileTravelStories'));
const DesktopTravelStories = lazy(() => import('./DesktopTravelStories'));

/** Same breakpoint split the rest of the app uses. */
const TravelStoriesRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <MobileTravelStories />
    </div>
    <div className="hidden lg:block">
      <DesktopTravelStories />
    </div>
  </Suspense>
);

export default TravelStoriesRoute;
