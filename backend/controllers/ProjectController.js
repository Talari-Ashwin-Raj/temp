/**
 * Project Controller
 * 
 * Controller Layer — handles HTTP requests for project management.
 * Delegates business logic to ProjectService.
 * 
 * Endpoints:
 *   GET    /api/projects                      — List projects
 *   POST   /api/projects                      — Create project
 *   GET    /api/projects/:id                   — Get project details
 *   PUT    /api/projects/:id                   — Update project
 *   DELETE /api/projects/:id                   — Delete project (Admin only)
 *   GET    /api/projects/:id/members           — List project members
 *   POST   /api/projects/:id/members           — Add member
 *   DELETE /api/projects/:id/members/:userId   — Remove member
 */

const ProjectService = require('../services/ProjectService');

const projectService = new ProjectService();

class ProjectController {
    /**
     * GET /api/projects
     */
    getProjects(req, res) {
        try {
            const projects = projectService.getProjects(req.user);
            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * POST /api/projects
     */
    createProject(req, res) {
        try {
            const project = projectService.createProject(req.body, req.user);
            res.status(201).json({
                success: true,
                message: 'Project created successfully',
                data: project,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * GET /api/projects/:id
     */
    getProjectById(req, res) {
        try {
            const project = projectService.getProjectById(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                data: project,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * PUT /api/projects/:id
     */
    updateProject(req, res) {
        try {
            const project = projectService.updateProject(
                parseInt(req.params.id),
                req.body,
                req.user
            );
            res.status(200).json({
                success: true,
                message: 'Project updated successfully',
                data: project,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * DELETE /api/projects/:id
     */
    deleteProject(req, res) {
        try {
            const result = projectService.deleteProject(
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

    /**
     * GET /api/projects/:id/members
     */
    getMembers(req, res) {
        try {
            const members = projectService.getMembers(parseInt(req.params.id));
            res.status(200).json({
                success: true,
                data: members,
                count: members.length,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * POST /api/projects/:id/members
     */
    addMember(req, res) {
        try {
            const result = projectService.addMember(
                parseInt(req.params.id),
                parseInt(req.body.userId),
                req.user
            );
            res.status(201).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404
                         : err.message.includes('already') ? 409 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * DELETE /api/projects/:id/members/:userId
     */
    removeMember(req, res) {
        try {
            const result = projectService.removeMember(
                parseInt(req.params.id),
                parseInt(req.params.userId),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }
}

module.exports = new ProjectController();
