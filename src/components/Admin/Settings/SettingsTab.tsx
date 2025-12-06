import { useEffect, useState } from 'react';
import { Settings, Plus, Trash2, Copy } from 'lucide-react';
import { getSystemSettings, updateSystemSetting, getAPIKeys, createAPIKey, deleteAPIKey, getActivityLogs, getCurrentAdmin } from '../../../utils/adminService';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
  updated_at: string;
}

interface APIKey {
  id: string;
  key_name: string;
  key_value: string;
  service_type: string;
  last_used: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  description: string;
  created_at: string;
}

export default function SettingsTab() {
  const [activeTab, setActiveTab] = useState('settings');
  const [settings, setSettings] = useState<Setting[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ keyName: '', serviceType: '' });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'settings') {
        const data = await getSystemSettings();
        setSettings(data);
      } else if (activeTab === 'api') {
        const keys = await getAPIKeys();
        setApiKeys(keys);
      } else if (activeTab === 'logs') {
        const { logs } = await getActivityLogs(1, 50);
        setActivityLogs(logs);
      }
    } catch (error) {
      console.error('Error loading settings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSetting = async (settingId: string, newValue: string) => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) throw new Error('Not authenticated');
      await updateSystemSetting(
        settingId,
        newValue,
        'Updated via admin panel',
        admin.id
      );
      loadData();
    } catch (error) {
      console.error('Error updating setting:', error);
    }
  };

  const handleCreateAPIKey = async () => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) throw new Error('Not authenticated');
      await createAPIKey(newKeyData.keyName, newKeyData.serviceType, admin.id);
      setShowApiModal(false);
      setNewKeyData({ keyName: '', serviceType: '' });
      loadData();
    } catch (error) {
      console.error('Error creating API key:', error);
    }
  };

  const handleDeleteAPIKey = async (keyId: string) => {
    try {
      await deleteAPIKey(keyId);
      loadData();
    } catch (error) {
      console.error('Error deleting API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
        <Settings size={28} />
        Settings
      </h2>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Platform Settings
          </button>
          <button
            onClick={() => setActiveTab('api')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'api'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            API Keys
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex-1 px-6 py-4 text-sm font-medium border-b-2 ${
              activeTab === 'logs'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Activity Logs
          </button>
        </div>
      </div>

      {/* Platform Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading settings...</div>
          ) : settings.length > 0 ? (
            settings.map((setting) => (
              <div key={setting.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{setting.key}</h3>
                  <span className="text-xs text-gray-500">
                    Updated: {new Date(setting.updated_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                <input
                  type="text"
                  defaultValue={JSON.stringify(setting.value)}
                  onBlur={(e) => {
                    if (e.target.value !== JSON.stringify(setting.value)) {
                      handleUpdateSetting(setting.key, e.target.value);
                    }
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">No settings available</div>
          )}
        </div>
      )}

      {/* API Keys Tab */}
      {activeTab === 'api' && (
        <div className="space-y-4">
          <button
            onClick={() => setShowApiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create API Key
          </button>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading API keys...</div>
            ) : apiKeys.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Service</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Key</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Used</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {apiKeys.map((key) => (
                      <tr key={key.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">{key.key_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{key.service_type}</td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                              {key.key_value.substring(0, 10)}...
                            </code>
                            <button
                              onClick={() => copyToClipboard(key.key_value)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Copy size={16} />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {key.last_used ? new Date(key.last_used).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => handleDeleteAPIKey(key.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">No API keys created</div>
            )}
          </div>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading activity logs...</div>
          ) : activityLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Resource</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.target_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">No activity logs</div>
          )}
        </div>
      )}

      {/* Create API Key Modal */}
      {showApiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKeyData.keyName}
                  onChange={(e) => setNewKeyData({ ...newKeyData, keyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Production API"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={newKeyData.serviceType}
                  onChange={(e) => setNewKeyData({ ...newKeyData, serviceType: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select service...</option>
                  <option value="analytics">Analytics</option>
                  <option value="integration">Integration</option>
                  <option value="webhook">Webhook</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApiModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAPIKey}
                disabled={!newKeyData.keyName || !newKeyData.serviceType}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}