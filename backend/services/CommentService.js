/**
 * CommentService
 * 
 * Design Pattern: SERVICE LAYER — business logic for task comments.
 * 
 * Maps to:
 *   useCaseDiagram → UC8: Add Comments on Tasks (Manager, Member)
 *   classDiagram   → Comment class, Member.addComment()
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

    /**
     * Add a comment to a task.
     * 
     * @param {number} taskId
     * @param {string} message
     * @param {User}   requestingUser
     * @returns {Object}
     */
    addComment(taskId, message, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canAddComment()) {
            throw new Error('Insufficient permissions to add comments');
        }

        if (!message || message.trim().length === 0) {
            throw new Error('Comment message cannot be empty');
        }

        // Verify task exists
        const task = this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Verify user has access to the project
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(task.project_id, requestingUser.id);
            const project = this.#projectRepository.findById(task.project_id);
            const isManager = project && project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        const comment = this.#commentRepository.create({
            taskId,
            userId: requestingUser.id,
            message: message.trim(),
        });

        // Notify the task assignee about the new comment (if not self)
        if (task.assigned_to && task.assigned_to !== requestingUser.id) {
            this.#notificationRepository.create({
                userId: task.assigned_to,
                message: `New comment on task "${task.title}" by ${requestingUser.username}`,
                type: 'comment_added',
                referenceId: taskId,
            });
        }

        return comment;
    }

    /**
     * Get all comments for a task.
     * @param {number} taskId
     * @param {User}   requestingUser
     * @returns {Object[]}
     */
    getCommentsByTask(taskId, requestingUser) {
        const task = this.#taskRepository.findById(taskId);
        if (!task) {
            throw new Error('Task not found');
        }

        // Access control
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(task.project_id, requestingUser.id);
            const project = this.#projectRepository.findById(task.project_id);
            const isManager = project && project.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        return this.#commentRepository.findByTask(taskId);
    }

    /**
     * Delete a comment (only the author or admin can delete).
     * @param {number} commentId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    deleteComment(commentId, requestingUser) {
        const comment = this.#commentRepository.findById(commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.user_id !== requestingUser.id && requestingUser.getRoleName() !== 'admin') {
            throw new Error('Insufficient permissions: you can only delete your own comments');
        }

        this.#commentRepository.deleteById(commentId);
        return { message: 'Comment deleted successfully' };
    }
}

module.exports = CommentService;
