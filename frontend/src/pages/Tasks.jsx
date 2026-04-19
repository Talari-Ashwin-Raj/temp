import { useState, useEffect } from 'react';
import ApiClient from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('all');
  const [loading, setLoading] = useState(true);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(null);
  
  const [newTask, setNewTask] = useState({ projectId: '', title: '', description: '', deadline: '', assignedTo: '' });
  const [projectMembers, setProjectMembers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        selectedProject === 'all' ? ApiClient.getMyTasks() : ApiClient.getTasksByProject(selectedProject),
        ApiClient.getProjects()
      ]);
      setTasks(tasksRes.data);
      setProjects(projectsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedProject]);

  useEffect(() => {
    if (newTask.projectId) {
      ApiClient.getProjectMembers(newTask.projectId)
        .then(res => setProjectMembers(res.data))
        .catch(err => console.error(err));
    } else if (showDetailModal && canCreate) {
      // Dynamic member list retrieval for the task detail modal's re-assignment dropdown
      ApiClient.getProjectMembers(showDetailModal.project_id)
        .then(res => setProjectMembers(res.data))
        .catch(err => console.error(err));
    } else {
      setProjectMembers([]);
    }
  }, [newTask.projectId, showDetailModal, canCreate]);

  useEffect(() => {
    if (showDetailModal) {
      ApiClient.getComments(showDetailModal.id)
        .then(res => setComments(res.data))
        .catch(err => console.error(err));
    }
  }, [showDetailModal]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await ApiClient.createTask({
        ...newTask,
        projectId: parseInt(newTask.projectId),
        assignedTo: newTask.assignedTo ? parseInt(newTask.assignedTo) : undefined
      });
      setShowCreateModal(false);
      setNewTask({ projectId: '', title: '', description: '', deadline: '', assignedTo: '' });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await ApiClient.updateTaskStatus(taskId, newStatus);
      fetchData();
      if (showDetailModal && showDetailModal.id === taskId) {
        setShowDetailModal(prev => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAssigneeChange = async (taskId, newAssigneeId) => {
    try {
      const payload = {
        title: showDetailModal.title,
        description: showDetailModal.description,
        deadline: showDetailModal.deadline,
        assignedTo: newAssigneeId ? parseInt(newAssigneeId) : null
      };
      const res = await ApiClient.updateTask(taskId, payload);
      
      fetchData();
      if (showDetailModal && showDetailModal.id === taskId) {
        // Hydrate assignee name proactively for instant feedback
        const memberName = projectMembers.find(m => m.id === parseInt(newAssigneeId))?.username || null;
        setShowDetailModal(prev => ({ 
          ...prev, 
          assigned_to: newAssigneeId ? parseInt(newAssigneeId) : null,
          assigned_to_name: memberName
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await ApiClient.addComment(showDetailModal.id, newComment);
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      alert(err.message);
    }
  };

  const columns = {
    todo: { title: 'To Do', items: tasks.filter(t => t.status === 'todo') },
    in_progress: { title: 'In Progress', items: tasks.filter(t => t.status === 'in_progress') },
    done: { title: 'Done', items: tasks.filter(t => t.status === 'done') }
  };

  if (loading && tasks.length === 0) return <div>Loading tasks...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="mb-1">Task Board</h1>
          <p className="text-muted">Track and manage tasks</p>
        </div>
        <div className="flex gap-4">
          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={selectedProject}
            onChange={e => setSelectedProject(e.target.value)}
          >
            <option value="all">My Tasks (Across all projects)</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.title}</option>
            ))}
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + New Task
            </button>
          )}
        </div>
      </div>

      <div className="kanban-board">
        {Object.entries(columns).map(([status, column]) => (
          <div key={status} className="kanban-column">
            <div className="kanban-header">
              {column.title}
              <span className={`badge status-${status}`}>{column.items.length}</span>
            </div>
            
            {column.items.map(task => (
              <div 
                key={task.id} 
                className="glass-card" 
                style={{ padding: '1rem', cursor: 'pointer' }}
                onClick={() => setShowDetailModal(task)}
              >
                <div className="text-xs text-muted mb-1">{task.project_title}</div>
                <h4 className="mb-2" style={{ fontSize: '1rem' }}>{task.title}</h4>
                
                <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                  <div className="text-xs">
                    {task.assigned_to_name ? (
                      <span className="text-muted">Assigned: <span style={{color: 'var(--text-primary)'}}>{task.assigned_to_name}</span></span>
                    ) : (
                      <span className="text-muted">Unassigned</span>
                    )}
                  </div>
                  {task.deadline && (
                    <div className="text-xs text-muted">
                      Due: {new Date(task.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="mb-4">Create New Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select 
                  className="form-select"
                  value={newTask.projectId}
                  onChange={e => setNewTask({...newTask, projectId: e.target.value})}
                  required
                >
                  <option value="">Select Project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                ></textarea>
              </div>
              <div className="grid grid-cols-2">
                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input
                    type="date"
                    className="form-input"
                    value={newTask.deadline}
                    onChange={e => setNewTask({...newTask, deadline: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign To</label>
                  <select 
                    className="form-select"
                    value={newTask.assignedTo}
                    onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                    disabled={!newTask.projectId}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailModal && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(null)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-muted mb-1">{showDetailModal.project_title}</div>
                <h2>{showDetailModal.title}</h2>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.2rem 0.5rem' }}
                onClick={() => setShowDetailModal(null)}
              >
                ✕
              </button>
            </div>
            
            <p className="mb-4">{showDetailModal.description || 'No description provided.'}</p>
            
            <div className="grid grid-cols-2 mb-6 gap-4" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px' }}>
              <div>
                <span className="text-xs text-muted block mb-1">Status</span>
                <select 
                  className="form-select" 
                  value={showDetailModal.status}
                  onChange={(e) => handleStatusChange(showDetailModal.id, e.target.value)}
                  style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done" disabled={showDetailModal.status === 'todo'}>Done</option>
                </select>
              </div>
              <div>
                <span className="text-xs text-muted block mb-1">Assigned To</span>
                {canCreate ? (
                  <select 
                    className="form-select" 
                    value={showDetailModal.assigned_to || ''}
                    onChange={(e) => handleAssigneeChange(showDetailModal.id, e.target.value)}
                    style={{ padding: '0.4rem', fontSize: '0.875rem' }}
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map(m => (
                      <option key={m.id} value={m.id}>{m.username}</option>
                    ))}
                  </select>
                ) : (
                  <div className="font-medium text-sm mt-2">{showDetailModal.assigned_to_name || 'Unassigned'}</div>
                )}
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="mb-4">Comments</h3>
              
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {comments.length === 0 ? (
                  <div className="text-muted text-sm italic">No comments yet.</div>
                ) : (
                  comments.map(c => (
                    <div key={c.id} style={{ background: 'rgba(30, 41, 59, 0.8)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">{c.author_name}</span>
                        <span className="text-xs text-muted">{new Date(c.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm m-0">{c.message}</p>
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  className="form-input"
                  style={{ padding: '0.5rem 0.75rem' }}
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
