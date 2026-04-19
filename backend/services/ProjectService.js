/**
 * ProjectService
 * 
 * Design Pattern: SERVICE LAYER — business logic for project management.
 */

const ProjectRepository = require('../repositories/ProjectRepository');
const UserRepository = require('../repositories/UserRepository');

class ProjectService {
    #projectRepository;
    #userRepository;

    constructor() {
        this.#projectRepository = new ProjectRepository();
        this.#userRepository = new UserRepository();
    }

    async createProject({ title, description, managerId }, requestingUser) {
        if (!requestingUser.canCreateProject()) {
            throw new Error('Insufficient permissions: only admins and managers can create projects');
        }

        if (!title) {
            throw new Error('Project title is required');
        }

        const finalManagerId = managerId || requestingUser.id;

        const managerRow = await this.#userRepository.findById(finalManagerId);
        if (!managerRow) {
            throw new Error('Specified manager not found');
        }
        if (managerRow.role_id !== 2 && managerRow.role_id !== 1) {
            throw new Error('Project manager must have a Manager or Admin role');
        }

        const row = await this.#projectRepository.create({
            title,
            description,
            manager_id: finalManagerId,
        });

        await this.#projectRepository.addMember(row.id, finalManagerId);

        return await this.#enrichProject(row);
    }

    async getProjects(requestingUser) {
        let rows;

        if (requestingUser.getRoleName() === 'admin') {
            rows = await this.#projectRepository.findAll();
        } else {
            rows = await this.#projectRepository.findAllByUserId(requestingUser.id);
        }

        return rows;
    }

    async getProjectById(projectId, requestingUser) {
        const row = await this.#projectRepository.findById(projectId);
        if (!row) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = await this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = row.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        const members = await this.#projectRepository.getMembers(projectId);
        return { ...row, members };
    }

    async updateProject(projectId, data, requestingUser) {
        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can update this project');
        }

        const updated = await this.#projectRepository.update(projectId, data);
        return await this.#enrichProject(updated);
    }

    async deleteProject(projectId, requestingUser) {
        if (!requestingUser.canDeleteProject()) {
            throw new Error('Insufficient permissions: only admins can delete projects');
        }

        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        await this.#projectRepository.delete(projectId);
        return { message: `Project '${project.title}' deleted successfully` };
    }

    async addMember(projectId, userId, requestingUser) {
        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can add members');
        }

        const user = await this.#userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const isMember = await this.#projectRepository.isMember(projectId, userId);
        if (isMember) {
            throw new Error('User is already a member of this project');
        }

        await this.#projectRepository.addMember(projectId, userId);

        return {
            message: `User '${user.username}' added to project '${project.title}'`,
            members: await this.#projectRepository.getMembers(projectId),
        };
    }

    async removeMember(projectId, userId, requestingUser) {
        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can remove members');
        }

        if (userId === project.manager_id) {
            throw new Error('Cannot remove the project manager from the project');
        }

        await this.#projectRepository.removeMember(projectId, userId);

        return {
            message: 'Member removed successfully',
            members: await this.#projectRepository.getMembers(projectId),
        };
    }

    async getMembers(projectId) {
        const project = await this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        return await this.#projectRepository.getMembers(projectId);
    }

    async #enrichProject(row) {
        const members = await this.#projectRepository.getMembers(row.id);
        return { ...row, memberCount: members.length };
    }
}

module.exports = ProjectService;
