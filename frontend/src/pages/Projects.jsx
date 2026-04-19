import { useState, useEffect } from 'react';
import ApiClient from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '', managerId: '' });
  const [availableManagers, setAvailableManagers] = useState([]);

  const [showMembersModal, setShowMembersModal] = useState(null);
  const [projectMembers, setProjectMembers] = useState([]);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [memberToAdd, setMemberToAdd] = useState('');

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
    if (user?.role === 'admin') {
      // Fetch managers and admins so they can be assigned as project managers
      Promise.all([
        ApiClient.getUsersByRole('manager'),
        ApiClient.getUsersByRole('admin')
      ]).then(([managersRes, adminsRes]) => {
        setAvailableManagers([...managersRes.data, ...adminsRes.data]);
      }).catch(err => console.error(err));
    }
  }, [user]);

  // Handle member modal data fetching
  useEffect(() => {
    if (showMembersModal) {
      ApiClient.getProjectMembers(showMembersModal.id)
        .then(res => setProjectMembers(res.data))
        .catch(err => console.error(err));
      
      ApiClient.getUsersByRole('member')
        .then(res => setAvailableMembers(res.data))
        .catch(err => console.error(err));
    }
  }, [showMembersModal]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...newProject };
      if (user?.role === 'admin' && payload.managerId) {
        payload.managerId = parseInt(payload.managerId);
      } else {
        payload.managerId = user.id; // Fallback to current manager
      }
      await ApiClient.createProject(payload);
      setShowCreateModal(false);
      setNewProject({ title: '', description: '', managerId: '' });
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

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberToAdd) return;
    try {
      await ApiClient.addProjectMember(showMembersModal.id, parseInt(memberToAdd));
      setMemberToAdd('');
      const res = await ApiClient.getProjectMembers(showMembersModal.id);
      setProjectMembers(res.data);
      fetchProjects(); // Refresh counts
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    try {
      await ApiClient.removeProjectMember(showMembersModal.id, userId);
      const res = await ApiClient.getProjectMembers(showMembersModal.id);
      setProjectMembers(res.data);
      fetchProjects(); // Refresh counts
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
                <div className="flex gap-2">
                  {(user?.role === 'admin' || user?.id === p.manager_id) && (
                    <button onClick={() => setShowMembersModal(p)} className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                      Manage Members
                    </button>
                  )}
                  {user?.role === 'admin' && (
                    <button onClick={() => handleDelete(p.id)} className="btn btn-danger" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>
                      Delete
                    </button>
                  )}
                </div>
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
              {user?.role === 'admin' && (
                <div className="form-group">
                  <label className="form-label">Assign Project Manager</label>
                  <select 
                    className="form-select"
                    value={newProject.managerId}
                    onChange={e => setNewProject({...newProject, managerId: e.target.value})}
                    required
                  >
                    <option value="">Select Manager</option>
                    {availableManagers.map(m => (
                      <option key={m.id} value={m.id}>{m.username} ({m.role})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(null)}>
          <div className="modal-content" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2>Project Members: {showMembersModal.title}</h2>
              <button className="btn btn-secondary" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setShowMembersModal(null)}>✕</button>
            </div>
            
            <div className="mb-6 border p-4" style={{ borderRadius: '8px', borderColor: 'var(--border-color)' }}>
              <h4 className="mb-3">Enrolled Roster</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {projectMembers.length === 0 ? (
                  <div className="text-muted text-sm italic">No members yet.</div>
                ) : (
                  projectMembers.map(m => (
                    <li key={m.id} className="flex justify-between items-center bg-slate-800 p-2 rounded">
                      <span className="text-sm">{m.username} <span className="text-xs text-muted">({m.email})</span></span>
                      {m.id !== showMembersModal.manager_id && (
                        <button onClick={() => handleRemoveMember(m.id)} className="text-red-400 hover:text-red-300 text-xs font-bold">Remove</button>
                      )}
                      {m.id === showMembersModal.manager_id && (
                        <span className="badge badge-manager text-xs">Manager</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="border-t pt-4">
               <h4 className="mb-3">Add Member to Project</h4>
               <form onSubmit={handleAddMember} className="flex gap-2">
                 <select 
                   className="form-select flex-1"
                   value={memberToAdd}
                   onChange={e => setMemberToAdd(e.target.value)}
                 >
                   <option value="">Select a member...</option>
                   {availableMembers.map(m => (
                     <option key={m.id} value={m.id} disabled={projectMembers.some(pm => pm.id === m.id)}>{m.username}</option>
                   ))}
                 </select>
                 <button type="submit" className="btn btn-primary" disabled={!memberToAdd}>Add</button>
               </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
