/**
 * TaskService
 * 
 * Design Pattern: SERVICE LAYER — business logic for task management.
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

    async createTask({ projectId, title, description, deadline, assignedTo }, requestingUser) {
        if (!requestingUser.canAssignTask() && requestingUser.getRoleName() !== 'admin') {
            throw new Error('Insufficient permissions: only managers and admins can create tasks');
        }

        if (!title) {
            throw new Error('Task title is required');
        }
        if (!projectId) {
            throw new Error('Project ID is required');
        }

        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = await this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        if (assignedTo) {
            const assignee = await this.#userRepository.findById(assignedTo);
            if (!assignee) {
                throw new Error('Assigned user not found');
            }
            const isMember = await this.#projectRepository.isMember(projectId, assignedTo);
            if (!isMember) {
                throw new Error('Cannot assign task: user is not a member of this project');
            }
        }

        const row = await this.#taskRepository.create({
            project_id: projectId,
            title,
            description,
            status: 'todo',
            deadline,
            assigned_to: assignedTo,
            created_by: requestingUser.id,
        });

        if (assignedTo) {
            await this.#notificationRepository.create({
                user_id: assignedTo,
                message: `New task assigned: "${title}" in project "${project.title}"`,
                type: 'task_assigned',
                reference_id: row.id,
            });
        }

        return await this.#taskRepository.findById(row.id);
    }

    async getTasksByProject(projectId, requestingUser) {
        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = await this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        return await this.#taskRepository.findAllByProjectId(projectId);
    }

    async getMyTasks(requestingUser) {
        return await this.#taskRepository.findAllByUserId(requestingUser.id);
    }

    async getTaskById(taskId, requestingUser) {
        const task = await this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = await this.#projectRepository.isMember(task.project_id, requestingUser.id);
            const project = await this.#projectRepository.findById(task.project_id);
            const isManager = project && project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        return task;
    }

    async updateTask(taskId, data, requestingUser) {
        const task = await this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const project = await this.#projectRepository.findById(task.project_id);

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can update task details');
        }

        if (data.assignedTo) {
            const isMember = await this.#projectRepository.isMember(task.project_id, data.assignedTo);
            if (!isMember) {
                throw new Error('Cannot assign task: user is not a member of this project');
            }

            if (data.assignedTo !== task.assigned_to) {
                await this.#notificationRepository.create({
                    user_id: data.assignedTo,
                    message: `Task reassigned to you: "${task.title}"`,
                    type: 'task_assigned',
                    reference_id: taskId,
                });
            }
        }

        return await this.#taskRepository.update(taskId, {
            ...data,
            assigned_to: data.assignedTo
        });
    }

    async updateTaskStatus(taskId, newStatus, requestingUser) {
        if (!requestingUser.canUpdateTaskStatus()) {
            throw new Error('Insufficient permissions to update task status');
        }

        const taskRow = await this.#taskRepository.findById(taskId);
        if (!taskRow) {
            throw new Error('Task not found');
        }

        if (requestingUser.getRoleName() === 'member') {
            if (taskRow.assigned_to !== requestingUser.id) {
                throw new Error('Access denied: you can only update tasks assigned to you');
            }
        }

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

        taskModel.changeStatus(newStatus);

        await this.#taskRepository.updateStatus(taskId, newStatus);

        const project = await this.#projectRepository.findById(taskRow.project_id);
        if (project && project.manager_id !== requestingUser.id) {
            await this.#notificationRepository.create({
                user_id: project.manager_id,
                message: `Task "${taskRow.title}" status changed to "${newStatus}" by ${requestingUser.username}`,
                type: 'status_change',
                reference_id: taskId,
            });
        }

        return await this.#taskRepository.findById(taskId);
    }

    async deleteTask(taskId, requestingUser) {
        const task = await this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        const project = await this.#projectRepository.findById(task.project_id);

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can delete tasks');
        }

        await this.#taskRepository.delete(taskId);
        return { message: `Task '${task.title}' deleted successfully` };
    }

    async getDashboardStats(requestingUser) {
        if (requestingUser.getRoleName() === 'admin') {
            const allTasks = await this.#taskRepository.findAll();
            return {
                overall: {
                    todo: allTasks.filter(t => t.status === 'todo').length,
                    in_progress: allTasks.filter(t => t.status === 'in_progress').length,
                    done: allTasks.filter(t => t.status === 'done').length,
                    total: allTasks.length
                },
                role: 'admin',
            };
        }

        const myTasks = await this.#taskRepository.findAllByUserId(requestingUser.id);
        return {
            myTasks: {
                todo: myTasks.filter(t => t.status === 'todo').length,
                in_progress: myTasks.filter(t => t.status === 'in_progress').length,
                done: myTasks.filter(t => t.status === 'done').length,
                total: myTasks.length
            },
            role: requestingUser.getRoleName(),
        };
    }
}

module.exports = TaskService;
