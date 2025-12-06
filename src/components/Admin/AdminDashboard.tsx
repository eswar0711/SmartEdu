import { useState, useEffect } from 'react';
import { supabase } from '../../utils/adminService';
import AdminSidebar from './Sidebar/AdminSidebar';
import OverviewCards from './Dashboard/OverviewCards';
import ActivityChart from './Dashboard/ActivityChart';
import UserManagementTab from './UserManagement/UserManagementTab';
import FacultyRequestsTab from './FacultyRequests/FacultyRequestsTab';
import SubjectManagementTab from './SubjectManagement/SubjectManagementTab';
import QuestionManagementTab from './QuestionManagement/QuestionManagementTab';
import AnalyticsTab from './Analytics/AnalyticsTab';
import SettingsTab from './Settings/SettingsTab';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [adminName, setAdminName] = useState('Admin');

  useEffect(() => {
    getAdminName();
  }, []);

  const getAdminName = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.email) {
        setAdminName(user.email.split('@')[0]);
      }
    } catch (error) {
      console.error('Error fetching admin name:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {adminName}! 👋
              </h1>
            </div>
            <OverviewCards />
            <ActivityChart />
          </div>
        );
      case 'users':
        return <UserManagementTab />;
      case 'faculty':
        return <FacultyRequestsTab />;
      case 'subjects':
        return <SubjectManagementTab />;
      case 'questions':
        return <QuestionManagementTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />

      <main className="flex-1 overflow-auto">
        <div className="p-8">{renderContent()}</div>
      </main>
    </div>
  );
}