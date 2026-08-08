import React, { Suspense, lazy } from 'react';

const MobileInternship = lazy(() => import('./MobileInternship'));
const DesktopInternship = lazy(() => import('./DesktopInternship'));

/** Same breakpoint split the rest of the app uses. */
const InternshipRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <MobileInternship />
    </div>
    <div className="hidden lg:block">
      <DesktopInternship />
    </div>
  </Suspense>
);

export default InternshipRoute;
