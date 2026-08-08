import React, { Suspense, lazy } from 'react';

const InternationalDetails = lazy(() => import('./InternationalDetails'));
const DesktopPackageDetails = lazy(() => import('../tours/DesktopPackageDetails'));

/** Breakpoint split for /taxi/user/international/details. */
function InternationalDetailsRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
        </div>
      }
    >
      <div className="block lg:hidden">
        <InternationalDetails />
      </div>

      <div className="hidden lg:block">
        <DesktopPackageDetails scope="international" />
      </div>
    </Suspense>
  );
}

export default InternationalDetailsRoute;
