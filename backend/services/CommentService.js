/**
 * CommentService
 * 
 * Design Pattern: SERVICE LAYER — business logic for task comments.
 */

const CommentRepository = require('../repositories/CommentRepository');
const TaskRepository = require('../repositories/TaskRepository');
const ProjectRepository = require('../repositories/ProjectRepository');
const NotificationRepository = require('../repositories/NotificationRepository');

class CommentService {
    #commentRepository;
    #taskRepository;
    #projectRepository;
    #notificationRepository;

    constructor() {
        this.#commentRepository = new CommentRepository();
        this.#taskRepository = new TaskRepository();
        this.#projectRepository = new ProjectRepository();
        this.#notificationRepository = new NotificationRepository();
    }

    async addComment(taskId, message, requestingUser) {
        if (!requestingUser.canAddComment()) {
            throw new Error('Insufficient permissions to add comments');
        }

        if (!message || message.trim().length === 0) {
            throw new Error('Comment message cannot be empty');
        }

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

        const comment = await this.#commentRepository.create({
            task_id: taskId,
            user_id: requestingUser.id,
            message: message.trim(),
        });

        if (task.assigned_to && task.assigned_to !== requestingUser.id) {
            await this.#notificationRepository.create({
                user_id: task.assigned_to,
                message: `New comment on task "${task.title}" by ${requestingUser.username}`,
                type: 'comment_added',
                reference_id: taskId,
            });
        }

        return comment;
    }

    async getCommentsByTask(taskId, requestingUser) {
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

        return await this.#commentRepository.findAllByTaskId(taskId);
    }

    async deleteComment(commentId, requestingUser) {
        const comment = await this.#commentRepository.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.user_id !== requestingUser.id && requestingUser.getRoleName() !== 'admin') {
            throw new Error('Insufficient permissions: you can only delete your own comments');
        }

        await this.#commentRepository.delete(commentId);
        return { message: 'Comment deleted successfully' };
    }
}

module.exports = CommentService;
