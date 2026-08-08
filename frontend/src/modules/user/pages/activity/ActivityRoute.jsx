import React, { Suspense, lazy } from 'react';
import Activity from '../Activity';

const DesktopActivity = lazy(() => import('./DesktopActivity'));

/** Same breakpoint split the rest of the app uses. */
const ActivityRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <Activity />
    </div>
    <div className="hidden lg:block">
      <DesktopActivity />
    </div>
  </Suspense>
);

export default ActivityRoute;
