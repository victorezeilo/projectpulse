import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Users, ChevronRight } from 'lucide-react';
import api from '../lib/api';
import type { Workspace, ApiResponse } from '../types';

export default function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await api.get<ApiResponse<Workspace[]>>('/workspaces');
      setWorkspaces(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch workspaces:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      await api.post('/workspaces', { name: newName });
      setNewName('');
      setShowCreate(false);
      fetchWorkspaces();
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workspaces</h1>
          <p className="text-gray-500 mt-1">Select a workspace to view projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          New Workspace
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
          <form onSubmit={createWorkspace} className="flex gap-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Workspace name"
              autoFocus
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {workspaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FolderOpen size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-gray-500 mb-4">Create your first workspace to get started</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Workspace
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => navigate(`/workspace/${ws.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{ws.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <FolderOpen size={14} />
                      {ws._count.projects} project{ws._count.projects !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {ws._count.members} member{ws._count.members !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <ChevronRight size={20} className="text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}