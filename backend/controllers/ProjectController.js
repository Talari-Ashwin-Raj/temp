/**
 * Project Controller
 * 
 * Controller Layer — handles HTTP requests for project management.
 */

const ProjectService = require('../services/ProjectService');

const projectService = new ProjectService();

class ProjectController {
    async getProjects(req, res) {
        try {
            const projects = await projectService.getProjects(req.user);
            res.status(200).json({
                success: true,
                data: projects,
                count: projects.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async createProject(req, res) {
        try {
            const project = await projectService.createProject(req.body, req.user);
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

    async getProjectById(req, res) {
        try {
            const project = await projectService.getProjectById(
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

    async updateProject(req, res) {
        try {
            const project = await projectService.updateProject(
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

    async deleteProject(req, res) {
        try {
            const result = await projectService.deleteProject(
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

    async getMembers(req, res) {
        try {
            const members = await projectService.getMembers(parseInt(req.params.id));
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

    async addMember(req, res) {
        try {
            const result = await projectService.addMember(
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

    async removeMember(req, res) {
        try {
            const result = await projectService.removeMember(
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
