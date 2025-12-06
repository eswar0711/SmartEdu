import { useEffect, useState } from 'react';
import {
  getStudentPerformanceData,
  getActivityMetrics,
  getQuestionAnalyticsData,
} from '../../../utils/adminService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface StudentPerf {
  name: string;
  averageScore: number;
  totalTests: number;
  completedTests: number;
}

interface QuestionAnalytics {
  question: string;
  successRate: number;
  totalAttempts: number;
}

interface ActivityData {
  date: string;
  logins: number;
  submissions: number;
  newUsers: number;
}

const AnalyticsTab: React.FC = () => {
  const [studentPerf, setStudentPerf] = useState<StudentPerf[]>([]);
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytics[]>([]);
  const [activityMetrics, setActivityMetrics] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllAnalytics();
  }, []);

  const loadAllAnalytics = async () => {
    try {
      setLoading(true);
      const [perfData, qData, aData] = await Promise.all([
        getStudentPerformanceData(),
        getQuestionAnalyticsData(),
        getActivityMetrics(),
      ]);
      setStudentPerf(perfData);
      setQuestionAnalytics(qData);
      setActivityMetrics(aData);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>

      {/* Activity Metrics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Activity Metrics (Last 7 Days)</h3>
        {activityMetrics.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityMetrics}>
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
          <div className="text-gray-500 text-center py-8">No activity data</div>
        )}
      </div>

      {/* Student Performance */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Top Student Performance</h3>
        {studentPerf.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={studentPerf.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="averageScore" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-gray-500 text-center py-8">No performance data</div>
        )}
      </div>

      {/* Question Analytics */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Question Success Rates</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Question</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Attempts</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Success Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {questionAnalytics.map((q, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{q.question}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{q.totalAttempts}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={
                            'h-full ' +
                            (q.successRate >= 75
                              ? 'bg-green-500'
                              : q.successRate >= 50
                              ? 'bg-yellow-500'
                              : 'bg-red-500')
                          }
                          style={{ width: `${q.successRate}%` }}
                        />
                      </div>
                      <span>{q.successRate.toFixed(1)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
