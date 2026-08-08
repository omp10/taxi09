import React, { Suspense, lazy } from 'react';
import Support from '../ride/Support';

const DesktopSupport = lazy(() => import('./DesktopSupport'));

/** Same breakpoint split the rest of the app uses. */
const SupportRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <Support />
    </div>
    <div className="hidden lg:block">
      <DesktopSupport />
    </div>
  </Suspense>
);

export default SupportRoute;
