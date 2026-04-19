/**
 * Comment Controller
 */

const CommentService = require('../services/CommentService');

const commentService = new CommentService();

class CommentController {
    async getCommentsByTask(req, res) {
        try {
            const comments = await commentService.getCommentsByTask(
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

    async addComment(req, res) {
        try {
            const { message } = req.body;
            const comment = await commentService.addComment(
                parseInt(req.params.taskId),
                message,
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

    async deleteComment(req, res) {
        try {
            const result = await commentService.deleteComment(
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
