import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Layout, ArrowLeft, Hash } from 'lucide-react';
import api from '../lib/api';
import type { WorkspaceDetail, ApiResponse } from '../types';

export default function WorkspacePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectKey, setProjectKey] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchWorkspace();
  }, [workspaceId]);

  const fetchWorkspace = async () => {
    try {
      const res = await api.get<ApiResponse<WorkspaceDetail>>(`/workspaces/${workspaceId}`);
      setWorkspace(res.data.data || null);
    } catch (error) {
      console.error('Failed to fetch workspace:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || !projectKey.trim()) return;

    try {
      await api.post('/projects', {
        workspaceId,
        name: projectName,
        description: projectDesc,
        key: projectKey.toUpperCase(),
      });
      setProjectName('');
      setProjectKey('');
      setProjectDesc('');
      setShowCreate(false);
      fetchWorkspace();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create project');
    }
  };

  // Auto-generate key from name
  const handleNameChange = (name: string) => {
    setProjectName(name);
    if (!projectKey || projectKey === projectName.substring(0, 4).toUpperCase()) {
      setProjectKey(name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, ''));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!workspace) {
    return <div className="text-center py-16 text-gray-500">Workspace not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 text-sm"
      >
        <ArrowLeft size={16} />
        Back to workspaces
      </button>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-500 mt-1">
            {workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''} · {workspace.projects.length} project{workspace.projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus size={18} />
          New Project
        </button>
      </div>

      {showCreate && (
        <div className="mb-6 bg-white rounded-lg border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Create Project</h3>
          <form onSubmit={createProject} className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="ProjectPulse"
                  autoFocus
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                <input
                  type="text"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value.toUpperCase())}
                  placeholder="PP"
                  required
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Brief description of the project"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create Project
              </button>
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {workspace.projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <Layout size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
          <p className="text-gray-500 mb-4">Create your first project to start managing tasks</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create Project
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {workspace.projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center">
                  <Hash size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{project.name}</h3>
                  <p className="text-sm text-gray-500">{project.key}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}