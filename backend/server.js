/**
 * Server Entry Point
 * 
 * Express application setup with:
 *   - CORS for frontend communication
 *   - JSON body parsing
 *   - Route mounting for all API endpoints
 *   - Global error handler
 * 
 * Architecture: idea.md → "Controller Layer handles incoming HTTP requests
 * and routes them to appropriate services."
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Route imports
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const commentRoutes = require('./routes/commentRoutes');

// Prisma Client connects automatically on first query.
const prisma = require('./prisma/prismaClient');
const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
    origin: function(origin, callback) {
        callback(null, true);
    },
    credentials: true,
}));
app.use(express.json());

// ── API Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/comments', commentRoutes);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'TaskHandler API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
    });
});

// ── API Docs endpoint ──────────────────────────────────────
app.get('/api', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Task & Team Management System API',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'Login and get JWT token',
                'GET  /api/auth/me': 'Get current user profile (auth required)',
            },
            users: {
                'GET    /api/users': 'List all users (Admin only)',
                'GET    /api/users/:id': 'Get user by ID',
                'PATCH  /api/users/:id/role': 'Update user role (Admin only)',
                'DELETE /api/users/:id': 'Delete user (Admin only)',
                'GET    /api/users/role/:roleName': 'Get users by role',
            },
            projects: {
                'GET    /api/projects': 'List projects',
                'POST   /api/projects': 'Create project (Admin/Manager)',
                'GET    /api/projects/:id': 'Get project details',
                'PUT    /api/projects/:id': 'Update project',
                'DELETE /api/projects/:id': 'Delete project (Admin only)',
                'GET    /api/projects/:id/members': 'List members',
                'POST   /api/projects/:id/members': 'Add member',
                'DELETE /api/projects/:id/members/:userId': 'Remove member',
            },
            tasks: {
                'POST   /api/tasks': 'Create task (Admin/Manager)',
                'GET    /api/tasks/my': 'Get my assigned tasks',
                'GET    /api/tasks/project/:projectId': 'Get tasks by project',
                'GET    /api/tasks/dashboard/stats': 'Get dashboard stats',
                'GET    /api/tasks/:id': 'Get task details',
                'PUT    /api/tasks/:id': 'Update task',
                'PATCH  /api/tasks/:id/status': 'Update task status',
                'DELETE /api/tasks/:id': 'Delete task (Admin/Manager)',
                'GET    /api/tasks/:taskId/comments': 'Get task comments',
                'POST   /api/tasks/:taskId/comments': 'Add comment',
            },
            notifications: {
                'GET   /api/notifications': 'Get all notifications',
                'GET   /api/notifications/unread': 'Get unread notifications',
                'PATCH /api/notifications/:id/read': 'Mark as read',
                'PATCH /api/notifications/read-all': 'Mark all as read',
            },
            comments: {
                'DELETE /api/comments/:id': 'Delete a comment',
            },
        },
    });
});

// ── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: `Route not found: ${req.method} ${req.originalUrl}`,
    });
});

// ── Global Error Handler ───────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
    });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
    console.log('');
    console.log('═'.repeat(55));
    console.log('  🚀 TaskHandler API Server');
    console.log('═'.repeat(55));
    console.log(`  URL:     http://localhost:${PORT}`);
    console.log(`  API:     http://localhost:${PORT}/api`);
    console.log(`  Health:  http://localhost:${PORT}/api/health`);
    console.log('═'.repeat(55));
    console.log('');
});

module.exports = app;
