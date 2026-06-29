import React, { Suspense, lazy } from 'react';

const MobileHome = lazy(() => import('./MobileHome'));
const DesktopHome = lazy(() => import('./DesktopHome'));

function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white">
        <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    }>
      {/* Mobile UI */}
      <div className="block lg:hidden">
        <MobileHome />
      </div>

      {/* Desktop UI */}
      <div className="hidden lg:block">
        <DesktopHome />
      </div>
    </Suspense>
  );
}

export default HomePage;
