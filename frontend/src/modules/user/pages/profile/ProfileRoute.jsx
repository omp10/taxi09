import React, { Suspense, lazy } from 'react';
import Profile from '../Profile';

const DesktopProfile = lazy(() => import('./DesktopProfile'));

/** Same breakpoint split the rest of the app uses. */
const ProfileRoute = () => (
  <Suspense
    fallback={
      <div className="flex min-h-screen items-center justify-center bg-white">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    }
  >
    <div className="block lg:hidden">
      <Profile />
    </div>
    <div className="hidden lg:block">
      <DesktopProfile />
    </div>
  </Suspense>
);

export default ProfileRoute;
