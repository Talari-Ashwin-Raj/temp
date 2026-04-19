/**
 * ProjectService
 * 
 * Design Pattern: SERVICE LAYER — business logic for project management.
 * 
 * Maps to useCaseDiagram:
 *   UC2 → Create Project (Admin, Manager)
 *   UC3 → Assign Project Manager (Admin)
 *   UC4 → Add/Remove Team Members (Admin, Manager)
 */

const ProjectRepository = require('../repositories/ProjectRepository');
const UserRepository = require('../repositories/UserRepository');
const Project = require('../models/Project');

class ProjectService {
    #projectRepository;
    #userRepository;

    constructor() {
        this.#projectRepository = new ProjectRepository();
        this.#userRepository = new UserRepository();
    }

    /**
     * Create a new project.
     * Only Admin and Manager can create projects.
     * 
     * @param {Object} data
     * @param {string} data.title
     * @param {string} data.description
     * @param {number} [data.managerId]
     * @param {User}   requestingUser
     * @returns {Object}
     */
    createProject({ title, description, managerId }, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canCreateProject()) {
            throw new Error('Insufficient permissions: only admins and managers can create projects');
        }

        if (!title) {
            throw new Error('Project title is required');
        }

        // If no manager specified, assign to the requesting user (if they're a manager)
        const finalManagerId = managerId || requestingUser.id;

        // Verify manager exists and is a manager/admin
        const managerRow = this.#userRepository.findById(finalManagerId);
        if (!managerRow) {
            throw new Error('Specified manager not found');
        }
        if (managerRow.role_id !== 2 && managerRow.role_id !== 1) {
            throw new Error('Project manager must have a Manager or Admin role');
        }

        const row = this.#projectRepository.create({
            title,
            description,
            managerId: finalManagerId,
        });

        // Auto-add the manager as a project member
        this.#projectRepository.addMember(row.id, finalManagerId);

        return this.#enrichProject(row);
    }

    /**
     * Get all projects (Admin sees all; others see only their own).
     * @param {User} requestingUser
     * @returns {Object[]}
     */
    getProjects(requestingUser) {
        let rows;

        if (requestingUser.getRoleName() === 'admin') {
            rows = this.#projectRepository.findAll();
        } else {
            rows = this.#projectRepository.findByUser(requestingUser.id);
        }

        return rows.map(row => this.#enrichProject(row));
    }

    /**
     * Get a single project by ID.
     * @param {number} projectId
     * @param {User}   requestingUser
     * @returns {Object}
     */
    getProjectById(projectId, requestingUser) {
        const row = this.#projectRepository.findByIdWithManager(projectId);
        if (!row) {
            throw new Error('Project not found');
        }

        // Non-admins can only see projects they belong to
        if (requestingUser.getRoleName() !== 'admin') {
            const isMember = this.#projectRepository.isMember(projectId, requestingUser.id);
            const isManager = row.manager_id === requestingUser.id;
            if (!isMember && !isManager) {
                throw new Error('Access denied: you are not a member of this project');
            }
        }

        const members = this.#projectRepository.getMembers(projectId);
        return { ...row, members };
    }

    /**
     * Update a project.
     * Only the project manager or Admin can update.
     * @param {number} projectId
     * @param {Object} data
     * @param {User}   requestingUser
     * @returns {Object}
     */
    updateProject(projectId, data, requestingUser) {
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        // Only admin or the project manager can update
        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can update this project');
        }

        const updated = this.#projectRepository.update(projectId, data);
        return this.#enrichProject(updated);
    }

    /**
     * Delete a project (Admin only).
     * @param {number} projectId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    deleteProject(projectId, requestingUser) {
        if (!requestingUser.canDeleteProject()) {
            throw new Error('Insufficient permissions: only admins can delete projects');
        }

        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        this.#projectRepository.deleteById(projectId);
        return { message: `Project '${project.title}' deleted successfully` };
    }

    /**
     * Add a member to a project.
     * Only Admin or the project Manager can add members.
     * 
     * Maps to useCaseDiagram → UC4: Add/Remove Team Members
     * 
     * @param {number} projectId
     * @param {number} userId
     * @param {User}   requestingUser
     * @returns {Object}
     */
    addMember(projectId, userId, requestingUser) {
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can add members');
        }

        const user = this.#userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if already a member
        if (this.#projectRepository.isMember(projectId, userId)) {
            throw new Error('User is already a member of this project');
        }

        this.#projectRepository.addMember(projectId, userId);

        return {
            message: `User '${user.username}' added to project '${project.title}'`,
            members: this.#projectRepository.getMembers(projectId),
        };
    }

    /**
     * Remove a member from a project.
     * @param {number} projectId
     * @param {number} userId
     * @param {User}   requestingUser
     * @returns {Object}
     */
    removeMember(projectId, userId, requestingUser) {
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }

        if (requestingUser.getRoleName() !== 'admin' && project.manager_id !== requestingUser.id) {
            throw new Error('Insufficient permissions: only the project manager or admin can remove members');
        }

        // Can't remove the manager
        if (userId === project.manager_id) {
            throw new Error('Cannot remove the project manager from the project');
        }

        this.#projectRepository.removeMember(projectId, userId);

        return {
            message: 'Member removed successfully',
            members: this.#projectRepository.getMembers(projectId),
        };
    }

    /**
     * Get members of a project.
     * @param {number} projectId
     * @returns {Object[]}
     */
    getMembers(projectId) {
        const project = this.#projectRepository.findById(projectId);
        if (!project) {
            throw new Error('Project not found');
        }
        return this.#projectRepository.getMembers(projectId);
    }

    /**
     * Enrich a raw project row with member count.
     * @private
     */
    #enrichProject(row) {
        const members = this.#projectRepository.getMembers(row.id);
        return { ...row, memberCount: members.length };
    }
}

module.exports = ProjectService;
