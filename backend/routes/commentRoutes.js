/**
 * Comment Routes (standalone — for delete by comment ID)
 */

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/CommentController');
const authenticate = require('../middleware/auth');

router.use(authenticate);

// Delete a comment by ID
router.delete('/:id', (req, res) => commentController.deleteComment(req, res));

module.exports = router;
