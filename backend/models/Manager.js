/**
 * Manager Model
 * 
 * OOP Principle: INHERITANCE — extends abstract User class
 * OOP Principle: POLYMORPHISM — overrides permission methods with Manager-specific behaviour
 * 
 * Managers can create projects, create & assign tasks, and manage team membership.
 * They cannot manage users or delete projects (Admin-only).
 */

const User = require('./User');

class Manager extends User {
    constructor(params) {
        super(params);
    }

    /** @override */
    getRoleName() {
        return 'manager';
    }

    /** @override */
    getPermissions() {
        return [
            'create_project',
            'add_remove_members',
            'create_task',
            'assign_task',
            'update_task_status',
            'add_comment',
            'view_dashboard',
        ];
    }

    // ── Polymorphic overrides ──────────────────────────────────

    canCreateProject()    { return true; }
    canAssignTask()       { return true; }
    canManageUsers()      { return false; }
    canUpdateTaskStatus() { return true; }
    canAddComment()       { return true; }
    canDeleteProject()    { return false; }

    /**
     * Manager-specific: create a new project under this manager.
     * Maps to classDiagram → Manager.createProject()
     * @param {Object} projectData
     */
    createProject(projectData) {
        return { ...projectData, managerId: this.id };
    }

    /**
     * Manager-specific: assign a task to a team member.
     * Maps to classDiagram → Manager.assignTask()
     * Maps to sequenceDiagram steps 1-9 (Manager → App → API → DB)
     * @param {number} taskId
     * @param {number} memberId
     */
    assignTask(taskId, memberId) {
        return { taskId, memberId, assignedBy: this.id };
    }
}

module.exports = Manager;
