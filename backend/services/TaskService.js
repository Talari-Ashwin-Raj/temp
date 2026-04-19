/**
 * TaskService
 * 
 * Design Pattern: SERVICE LAYER — business logic for task management.
 * 
 * Maps to:
 *   useCaseDiagram  → UC5 (Create Task), UC6 (Assign Task), UC7 (Update Status)
 *   sequenceDiagram → Full create-and-assign flow (steps 1-9 + async notification)
 *   classDiagram    → Task.changeStatus(), Manager.assignTask(), Member.updateTaskStatus()
 */

const TaskRepository = require('../repositories/TaskRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const UserRepository = require('../repositories/UserRepository');
const Task = require('../models/Task');

class TaskService {
    #taskRepository;
    #projectRepository;
    #notificationRepository;
    #userRepository;

    constructor() {
        this.#taskRepository = new TaskRepository();
        this.#projectRepository = new ProjectRepository();
        this.#notificationRepository = new NotificationRepository();
        this.#userRepository = new UserRepository();
    }

    /**
     * Create a new task and optionally assign it.
     * 
     * This method implements the full Sequence Diagram flow:
     *   1. Manager clicks "Create Task" → frontend sends POST /api/tasks
     *   2. API validates Manager permissions
     *   3. INSERT INTO tasks
     *   4. Return 201 Created
     *   5. Async: Send notification to assigned member
     * 
     * @param {Object} data
     * @param {number} data.projectId
     * @param {string} data.title
     * @param {string} [data.description]
     * @param {string} [data.deadline]
     * @param {number} [data.assignedTo]
     * @param {User}   requestingUser
     * @returns {Object}
     */
    createTask({ projectId, title, description, deadline, assignedTo }, requestingUser) {
        // Step 2: Validate permissions (Polymorphism)
        if (!requestingUser.canAssignTask() && requestingUser.getRoleName() !== 'admin') {
            throw new Error('Insufficient permissions: only managers and admins can create tasks');
        }

        if (!title) {
            throw new Error('Task title is required');
        }
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        // Verify project exists
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Verify the requesting user has access to this project
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        // If assigning, verify assignee is a project member
        if (assignedTo) {
            const assignee = this.#userRepository.findById(assignedTo);
            if (!assignee) {
                throw new Error('Assigned user not found');
            }
            const isMember = this.#projectRepository.isMember(projectId, assignedTo);
            if (!isMember) {
                throw new Error('Cannot assign task: user is not a member of this project');
            }
        }

        // Step 3: INSERT INTO tasks
        const row = this.#taskRepository.create({
            projectId,
            title,
            description,
            status: 'todo',
            deadline,
            assignedTo,
            createdBy: requestingUser.id,
        });

        // Step 5: Async notification to assigned member (Sequence Diagram)
        if (assignedTo) {
            this.#notificationRepository.create({
                userId: assignedTo,
                message: `New task assigned: "${title}" in project "${project.title}"`,
                type: 'task_assigned',
                referenceId: row.id,
            });
        }

        return this.#taskRepository.findByIdWithDetails(row.id);
    }

    /**
     * Get all tasks for a project.
     * @param {number} projectId
     * @param {User}   requestingUser
     * @returns {Object[]}
     */
    getTasksByProject(projectId, requestingUser) {
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Access control
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        return this.#taskRepository.findByProject(projectId);
    }

    /**
     * Get tasks assigned to the current user.
     * @param {User} requestingUser
     * @returns {Object[]}
     */
    getMyTasks(requestingUser) {
        return this.#taskRepository.findByAssignee(requestingUser.id);
    }

    /**
     * Get a task by ID with full details.
     * @param {number} taskId
     * @param {User}   requestingUser
     * @returns {Object}
     */
    getTaskById(taskId, requestingUser) {
        const task = this.#taskRepository.findByIdWithDetails(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Access control: must be member of the task's project
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(task.project_id, requestingUser.id);
            const project = this.#projectRepository.findById(task.project_id);
            const isManager = project && project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        return task;
    }

    /**
     * Update task details (not status — use updateTaskStatus for that).
     * Only the project manager or admin can update task metadata.
     * @param {number} taskId
     * @param {Object} data
     * @param {User}   requestingUser
     * @returns {Object}
     */
    updateTask(taskId, data, requestingUser) {
        const task = this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const project = this.#projectRepository.findById(task.project_id);

        // Only admin or project manager can edit task metadata
        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can update task details');
        }

        // If reassigning, verify new assignee is a project member
        if (data.assignedTo) {
            const isMember = this.#projectRepository.isMember(task.project_id, data.assignedTo);
            if (!isMember) {
                throw new Error('Cannot assign task: user is not a member of this project');
            }

            // Notify new assignee
            if (data.assignedTo !== task.assigned_to) {
                this.#notificationRepository.create({
                    userId: data.assignedTo,
                    message: `Task reassigned to you: "${task.title}"`,
                    type: 'task_assigned',
                    referenceId: taskId,
                });
            }
        }

        return this.#taskRepository.update(taskId, data);
    }

    /**
     * Update task status with validation.
     * 
     * Maps to:
     *   useCaseDiagram → UC7: Update Task Status (Manager, Member)
     *   classDiagram   → Task.changeStatus(), Member.updateTaskStatus()
     * 
     * Members can only update tasks assigned to them.
     * Managers/Admins can update any task in their projects.
     * 
     * @param {number} taskId
     * @param {string} newStatus - 'todo', 'in_progress', or 'done'
     * @param {User}   requestingUser
     * @returns {Object}
     */
    updateTaskStatus(taskId, newStatus, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canUpdateTaskStatus()) {
            throw new Error('Insufficient permissions to update task status');
        }

        const taskRow = this.#taskRepository.findById(taskId);
        if (!taskRow) {
            throw new Error('Task not found');
        }

        // Members can only update their own assigned tasks
        if (requestingUser.getRoleName() === 'member') {
            if (taskRow.assigned_to !== requestingUser.id) {
                throw new Error('Access denied: you can only update tasks assigned to you');
            }
        }

        // Use the Task model's changeStatus() for transition validation
        const taskModel = new Task({
            id: taskRow.id,
            projectId: taskRow.project_id,
            title: taskRow.title,
            description: taskRow.description,
            status: taskRow.status,
            deadline: taskRow.deadline,
            assignedTo: taskRow.assigned_to,
            createdBy: taskRow.created_by,
            createdAt: taskRow.created_at,
            updatedAt: taskRow.updated_at,
        });

        // This will throw if the transition is invalid
        taskModel.changeStatus(newStatus);

        // Persist the valid transition
        this.#taskRepository.updateStatus(taskId, newStatus);

        // Notify relevant parties about status change
        const project = this.#projectRepository.findById(taskRow.project_id);
        if (project && project.manager_id !== requestingUser.id) {
            this.#notificationRepository.create({
                userId: project.manager_id,
                message: `Task "${taskRow.title}" status changed to "${newStatus}" by ${requestingUser.username}`,
                type: 'status_change',
                referenceId: taskId,
            });
        }

        return this.#taskRepository.findByIdWithDetails(taskId);
    }

    /**
     * Delete a task (Manager of the project or Admin only).
     * @param {number} taskId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    deleteTask(taskId, requestingUser) {
        const task = this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const project = this.#projectRepository.findById(task.project_id);

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can delete tasks');
        }

        this.#taskRepository.deleteById(taskId);
        return { message: `Task '${task.title}' deleted successfully` };
    }

    /**
     * Get dashboard statistics.
     * @param {User} requestingUser
     * @returns {Object}
     */
    getDashboardStats(requestingUser) {
        if (requestingUser.getRoleName() === 'admin') {
            return {
                overall: this.#taskRepository.getOverallStats(),
                role: 'admin',
            };
        }

        return {
            myTasks: this.#taskRepository.getStatsByUser(requestingUser.id),
            role: requestingUser.getRoleName(),
        };
    }
}

module.exports = TaskService;
