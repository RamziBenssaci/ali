import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { apiCall } from '@/lib/api';

interface RouteProtectionProps {
  children: React.ReactNode;
}

const RouteProtection = ({ children }: RouteProtectionProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Make API call to check authentication/authorization
        // Send current route information with the request
        await apiCall('/auth/verify', { 
          method: 'POST',
          body: JSON.stringify({
            route: location.pathname,
            fullPath: location.pathname + location.search,
            search: location.search,
            hash: location.hash
          })
        }, true);
        setIsAuthorized(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [location.pathname]); // Re-run when route changes

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // If not authorized, show permission denied page
  if (!isAuthorized) {
    return <Navigate to="/permission-denied" replace />;
  }

  // If authorized, render the children
  return <>{children}</>;
};

export default RouteProtection;
