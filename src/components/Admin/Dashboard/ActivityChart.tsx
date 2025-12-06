import { useEffect, useState } from 'react';
import { getActivityMetrics } from '../../../utils/adminService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ActivityData {
  date: string;
  logins: number;
  submissions: number;
  newUsers: number;
}

const ActivityChart: React.FC = () => {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const metrics = await getActivityMetrics();
      setData(metrics);
    } catch (error) {
      console.error('Error loading activity metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="bg-white rounded-lg shadow-md p-6 h-96 animate-pulse" />;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Metrics (Last 7 Days)</h2>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="logins" stroke="#3B82F6" strokeWidth={2} />
            <Line type="monotone" dataKey="submissions" stroke="#10B981" strokeWidth={2} />
            <Line type="monotone" dataKey="newUsers" stroke="#F59E0B" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No activity data available
        </div>
      )}
    </div>
  );
};

export default ActivityChart;
