/**
 * Member Model
 * 
 * OOP Principle: INHERITANCE — extends abstract User class
 * OOP Principle: POLYMORPHISM — overrides permission methods with Member-specific behaviour
 * 
 * Members have the most restricted permissions:
 *   - Can update the status of tasks assigned to them
 *   - Can add comments on tasks
 *   - Can view the dashboard
 *   - Cannot create projects, assign tasks, or manage users
 */

const User = require('./User');

class Member extends User {
    constructor(params) {
        super(params);
    }

    /** @override */
    getRoleName() {
        return 'member';
    }

    /** @override */
    getPermissions() {
        return [
            'update_task_status',
            'add_comment',
            'view_dashboard',
        ];
    }

    // ── Polymorphic overrides ──────────────────────────────────

    canCreateProject()    { return false; }
    canAssignTask()       { return false; }
    canManageUsers()      { return false; }
    canUpdateTaskStatus() { return true; }
    canAddComment()       { return true; }
    canDeleteProject()    { return false; }

    /**
     * Member-specific: update status of an assigned task.
     * Maps to classDiagram → Member.updateTaskStatus()
     * @param {number} taskId
     * @param {string} newStatus  — one of 'todo', 'in_progress', 'done'
     */
    updateTaskStatus(taskId, newStatus) {
        return { taskId, newStatus, updatedBy: this.id };
    }

    /**
     * Member-specific: add a comment to a task.
     * Maps to classDiagram → Member.addComment()
     * @param {number} taskId
     * @param {string} content
     */
    addComment(taskId, content) {
        return { taskId, content, authorId: this.id };
    }
}

module.exports = Member;
