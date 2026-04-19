/**
 * Comment Controller
 * 
 * Controller Layer — handles HTTP requests for task comments.
 * 
 * Endpoints:
 *   GET    /api/tasks/:taskId/comments  — Get comments for a task
 *   POST   /api/tasks/:taskId/comments  — Add a comment
 *   DELETE /api/comments/:id            — Delete a comment
 */

const CommentService = require('../services/CommentService');

const commentService = new CommentService();

class CommentController {
    /**
     * GET /api/tasks/:taskId/comments
     */
    getComments(req, res) {
        try {
            const comments = commentService.getCommentsByTask(
                parseInt(req.params.taskId),
                req.user
            );
            res.status(200).json({
                success: true,
                data: comments,
                count: comments.length,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * POST /api/tasks/:taskId/comments
     * Maps to useCaseDiagram UC8: Add Comments on Tasks
     */
    addComment(req, res) {
        try {
            const comment = commentService.addComment(
                parseInt(req.params.taskId),
                req.body.message,
                req.user
            );
            res.status(201).json({
                success: true,
                message: 'Comment added successfully',
                data: comment,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * DELETE /api/comments/:id
     */
    deleteComment(req, res) {
        try {
            const result = commentService.deleteComment(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }
}

module.exports = new CommentController();
