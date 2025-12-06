import { useEffect, useState } from 'react';
import { Search, Plus, Edit2, Archive, RotateCcw } from 'lucide-react';
import { getSubjects, createSubject, updateSubject, archiveSubject, activateSubject, getCurrentAdmin, assignFacultyToSubject, getFacultyList } from '../../../utils/adminService';

interface Subject {
  id: string;
  name: string;
  code: string;
  semester: number;
  department: string;
  description: string;
  is_active: boolean;
  student_count: number;
}

interface Faculty {
  id: string;
  email: string;
  full_name: string;
}

export default function SubjectManagementTab() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    semester: 1,
    department: '',
    description: '',
  });

  useEffect(() => {
    loadSubjects();
    loadFaculty();
  }, [page, search, statusFilter]);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const { subjects: data, total: count } = await getSubjects(page, 10, statusFilter, search);
      setSubjects(data);
      setTotal(count);
    } catch (error) {
      console.error('Error loading subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFaculty = async () => {
    try {
      const faculty = await getFacultyList();
      setFacultyList(faculty);
    } catch (error) {
      console.error('Error loading faculty:', error);
    }
  };

  const handleCreateSubject = async () => {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) throw new Error('Not authenticated');
      await createSubject(formData, admin.id);
      setShowModal(false);
      setFormData({ name: '', code: '', semester: 1, department: '', description: '' });
      loadSubjects();
    } catch (error) {
      console.error('Error creating subject:', error);
    }
  };

  const handleEditSubject = async () => {
    if (!selectedSubject) return;
    try {
      await updateSubject(selectedSubject.id, formData);
      setShowModal(false);
      loadSubjects();
    } catch (error) {
      console.error('Error updating subject:', error);
    }
  };

  const handleArchiveSubject = async (subjectId: string) => {
    try {
      await archiveSubject(subjectId);
      loadSubjects();
    } catch (error) {
      console.error('Error archiving subject:', error);
    }
  };

  const handleActivateSubject = async (subjectId: string) => {
    try {
      await activateSubject(subjectId);
      loadSubjects();
    } catch (error) {
      console.error('Error activating subject:', error);
    }
  };

  const handleAssignFaculty = async () => {
    if (!selectedSubject || selectedFaculty.length === 0) return;
    try {
      const admin = await getCurrentAdmin();
      if (!admin) throw new Error('Not authenticated');
      await assignFacultyToSubject(selectedSubject.id, selectedFaculty, admin.id);
      setShowAssignModal(false);
      setSelectedFaculty([]);
      loadSubjects();
    } catch (error) {
      console.error('Error assigning faculty:', error);
    }
  };

  const openEditModal = (subject: Subject) => {
    setSelectedSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      semester: subject.semester,
      department: subject.department,
      description: subject.description,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Subject Management</h2>
        <button
          onClick={() => {
            setSelectedSubject(null);
            setFormData({ name: '', code: '', semester: 1, department: '', description: '' });
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Add Subject
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search subjects..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="active">Active</option>
            <option value="archived">Archived</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading subjects...</div>
        ) : subjects.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Code</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Semester</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Department</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Students</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {subjects.map((subject) => (
                    <tr key={subject.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{subject.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.semester}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{subject.student_count}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subject.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {subject.is_active ? 'Active' : 'Archived'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm space-x-2 flex">
                        <button
                          onClick={() => openEditModal(subject)}
                          className="inline-flex items-center gap-1 px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSubject(subject);
                            setShowAssignModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded"
                        >
                          👥
                        </button>
                        {subject.is_active ? (
                          <button
                            onClick={() => handleArchiveSubject(subject.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Archive size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateSubject(subject.id)}
                            className="inline-flex items-center gap-1 px-3 py-1 text-green-600 hover:bg-green-50 rounded"
                          >
                            <RotateCcw size={16} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Page {page} of {Math.ceil(total / 10)} • Total: {total} subjects
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page * 10 >= total}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-gray-500">No subjects found</div>
        )}
      </div>

      {/* Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {selectedSubject ? 'Edit Subject' : 'Create Subject'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Subject name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="CS101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
                <select
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Computer Science"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
                  placeholder="Subject description"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={selectedSubject ? handleEditSubject : handleCreateSubject}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {selectedSubject ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Faculty Modal */}
      {showAssignModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Assign Faculty to {selectedSubject.name}
            </h3>
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {facultyList.map((faculty) => (
                <label key={faculty.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedFaculty.includes(faculty.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedFaculty([...selectedFaculty, faculty.id]);
                      } else {
                        setSelectedFaculty(selectedFaculty.filter((id) => id !== faculty.id));
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{faculty.full_name}</p>
                    <p className="text-xs text-gray-600">{faculty.email}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedFaculty([]);
                }}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignFaculty}
                disabled={selectedFaculty.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Assign ({selectedFaculty.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}