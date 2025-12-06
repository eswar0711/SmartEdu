import { useEffect, useState } from 'react';
import { Users, BookOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { getAnalyticsOverview } from '../../../utils/adminService';

interface Analytics {
  totalStudents: number;
  totalCourses: number;
  averageScore: number;
  completionRate: number;
}

const OverviewCards: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics>({
    totalStudents: 0,
    totalCourses: 0,
    averageScore: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalyticsOverview();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Students',
      value: analytics.totalStudents,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Subjects',
      value: analytics.totalCourses,
      icon: BookOpen,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Average Score',
      value: `${analytics.averageScore}%`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Completion Rate',
      value: `${analytics.completionRate}%`,
      icon: BarChart3,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-32 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{card.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {typeof card.value === 'number'
                  ? card.value.toLocaleString()
                  : card.value}
              </p>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
};

export default OverviewCards;
