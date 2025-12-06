import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAdminAccess } from '../../utils/adminService';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Admin Route Component
 *
 * DEV MODE:
 * - true  → access admin dashboard WITHOUT strict login (development only)
 * - false → strict admin authentication required (production)
 *
 * ⚠️ IMPORTANT: Always keep DEV_MODE = false in production!
 */

const DEV_MODE = false; // ✅ Set to FALSE for production

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Development mode bypass
    if (DEV_MODE) {
      setIsAdmin(true);
      setLoading(false);
      return;
    }

    // Production mode - check admin access
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      // ✅ Checks JWT metadata, not database!
      const hasAccess = await checkAdminAccess();

      if (!hasAccess) {
        navigate('/login');
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
}