import { useState, useEffect } from 'react';
import ApiClient from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await ApiClient.getProjects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await ApiClient.createProject(newProject);
      setShowCreateModal(false);
      setNewProject({ title: '', description: '' });
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await ApiClient.deleteProject(id);
      fetchProjects();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-1">Projects</h1>
          <p className="text-muted">Manage your teams and initiatives</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            + New Project
          </button>
        )}
      </div>

      <div className="grid grid-cols-3">
        {projects.length === 0 ? (
          <div className="text-muted">No projects found.</div>
        ) : (
          projects.map(p => (
            <div key={p.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1 }}>
                <h3 className="mb-2">{p.title}</h3>
                <p className="text-sm text-muted mb-4">{p.description || 'No description provided.'}</p>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                <div className="text-xs text-muted">
                  Members: {p.memberCount}
                </div>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(p.id)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Create New Project</h2>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newProject.title}
                  onChange={e => setNewProject({...newProject, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newProject.description}
                  onChange={e => setNewProject({...newProject, description: e.target.value})}
                ></textarea>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
