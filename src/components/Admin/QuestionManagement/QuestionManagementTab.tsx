import { useEffect, useState } from 'react';
import { BarChart3, Search } from 'lucide-react';

interface QuestionAnalytics {
  question: string;
  difficulty: string;
  successRate: number;
  totalAttempts: number;
}

export default function QuestionManagementTab() {
  const [analytics, setAnalytics] = useState<QuestionAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadQuestionAnalytics();
  }, []);

  const loadQuestionAnalytics = async () => {
    try {
      setLoading(true);
      // Import and call getQuestionAnalyticsData from adminService
      const response = await fetch('/api/questions-analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading question analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnalytics = analytics.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );

  const difficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Question Management</h2>
        <BarChart3 className="text-blue-600" size={28} />
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading questions...</div>
        ) : filteredAnalytics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Question</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Difficulty</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Attempts</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredAnalytics.map((q, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{q.question}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${difficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{q.totalAttempts}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              q.successRate >= 75
                                ? 'bg-green-500'
                                : q.successRate >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${q.successRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{q.successRate.toFixed(1)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">No questions found</div>
        )}
      </div>
    </div>
  );
}