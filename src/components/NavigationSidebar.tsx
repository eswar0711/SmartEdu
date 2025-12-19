import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  PlusCircle,
  Home,
  FileText,
  Calculator,
  Sparkles,
  User as UserIcon,
  Lock,
  BarChart3,
  Users,
  Menu,
  X,
} from 'lucide-react';
import { signOut } from '../utils/auth';
import type { User } from '../utils/supabaseClient';

interface NavigationSidebarProps {
  user: User;
}

const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false); // ✅ added

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
      window.location.reload();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ✅ Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2
        bg-gradient-to-r from-orange-100 to-indigo-200
        hover:from-indigo-300 hover:to-orange-300 
        text-black rounded-xl shadow-lg"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* ✅ Sidebar */}
      <div
        className={`fixed md:relative top-0 left-0 h-screen w-64 bg-white
        border-r border-gray-200 flex flex-col shadow-sm z-40
        transform transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0`}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-800">EduVerge</h1>
          </div>
          <p className="text-sm font-medium text-gray-800">{user.full_name}</p>
          <p className="text-xs text-gray-500 capitalize mt-1">
            {user.role === 'admin'
              ? '🔐 Admin'
              : user.role === 'faculty'
              ? '👨‍🏫 Faculty'
              : '👨‍🎓 Student'}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* ADMIN */}
          {user.role === 'admin' && (
            <>
              <Link
                to="/admin/dashboard"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/admin/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Admin Dashboard
              </Link>

              <Link
                to="/admin/users"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/admin/users')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Users className="w-5 h-5" />
                User Management
              </Link>

              <Link
                to="/admin/submissions"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/admin/submissions')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                View Submissions
              </Link>

              <Link
                to="/admin/analytics"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/admin/analytics')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <BarChart3 className="w-5 h-5" />
                Analytics
              </Link>
            </>
          )}

          {/* FACULTY */}
          {user.role === 'faculty' && (
            <>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/faculty/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Link>

              <Link
                to="/create-assessment"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/create-assessment')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <PlusCircle className="w-5 h-5" />
                Create Assessment
              </Link>

              <Link
                to="/course-materials"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/course-materials')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <FileText className="w-5 h-5" />
                Course Materials
              </Link>
            </>
          )}

          {/* STUDENT */}
          {user.role === 'student' && (
            <>
              <Link
                to="/"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/student/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Home className="w-5 h-5" />
                Dashboard
              </Link>

              <Link
                to="/courses"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/courses')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Course Materials
              </Link>

              <Link
                to="/score-calculator"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/score-calculator')
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Calculator className="w-5 h-5" />
                Score Calculator
              </Link>

              <Link
                to="/ai-assistant"
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
                  isActive('/ai-assistant')
                    ? 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700'
                    : 'text-gray-700 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                AI Assistant
              </Link>
            </>
          )}

          <div className="my-4 h-px bg-gray-200" />

          <div className="text-xs font-semibold text-gray-500 uppercase px-4 py-2">
            Settings
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              isActive('/profile')
                ? 'bg-green-100 text-green-700'
                : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
            }`}
          >
            <UserIcon className="w-5 h-5" />
            My Profile
          </Link>

          <Link
            to="/change-password"
            onClick={() => setIsOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium ${
              isActive('/change-password')
                ? 'bg-orange-100 text-orange-700'
                : 'text-gray-700 hover:bg-orange-50 hover:text-orange-700'
            }`}
          >
            <Lock className="w-5 h-5" />
            Change Password
          </Link>
        </nav>

        {/* Sign Out */}
        <div className="p-4 border-t">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ✅ Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default NavigationSidebar;
