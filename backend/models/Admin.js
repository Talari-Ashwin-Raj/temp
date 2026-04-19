/**
 * Admin Model
 * 
 * OOP Principle: INHERITANCE — extends abstract User class
 * OOP Principle: POLYMORPHISM — overrides permission methods with Admin-specific behaviour
 * 
 * Admin has the highest privileges: manage users, create/delete projects, and full task control.
 */

const User = require('./User');

class Admin extends User {
    constructor(params) {
        super(params);
    }

    /** @override */
    getRoleName() {
        return 'admin';
    }

    /** @override */
    getPermissions() {
        return [
            'manage_users',
            'create_project',
            'delete_project',
            'assign_project_manager',
            'add_remove_members',
            'create_task',
            'assign_task',
            'update_task_status',
            'delete_task',
            'add_comment',
            'view_dashboard',
        ];
    }

    // ── Polymorphic overrides ──────────────────────────────────

    canCreateProject()    { return true; }
    canAssignTask()       { return true; }
    canManageUsers()      { return true; }
    canUpdateTaskStatus() { return true; }
    canAddComment()       { return true; }
    canDeleteProject()    { return true; }

    /**
     * Admin-specific: manage user accounts (enable/disable, change roles).
     * @param {number} userId
     * @param {Object} changes
     */
    manageUsers(userId, changes) {
        // Business logic delegated to UserService; this method exists
        // to satisfy the class diagram's Admin.manageUsers() contract.
        return { userId, changes, authorisedBy: this.id };
    }

    /**
     * Admin-specific: configure role permissions.
     * @param {number} roleId
     * @param {string[]} permissions
     */
    configureRoles(roleId, permissions) {
        return { roleId, permissions, authorisedBy: this.id };
    }
}

module.exports = Admin;
