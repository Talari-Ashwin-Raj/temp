/**
 * Task Model
 * 
 * OOP Principle: ENCAPSULATION — private fields with controlled accessors
 * 
 * Maps to classDiagram → Task class and ErDiagram → TASKS table.
 * Status follows the lifecycle: todo → in_progress → done
 */

class Task {
    #id;
    #projectId;
    #title;
    #description;
    #status;
    #deadline;
    #assignedTo;
    #createdBy;
    #createdAt;
    #updatedAt;

    /** Valid status transitions */
    static VALID_STATUSES = ['todo', 'in_progress', 'done'];

    /** Allowed transitions map */
    static STATUS_TRANSITIONS = {
        todo:        ['in_progress'],
        in_progress: ['done', 'todo'],
        done:        ['in_progress'],
    };

    /**
     * @param {Object} params
     */
    constructor({ id, projectId, title, description, status, deadline, assignedTo, createdBy, createdAt, updatedAt }) {
        this.#id = id;
        this.#projectId = projectId;
        this.#title = title;
        this.#description = description;
        this.#status = status || 'todo';
        this.#deadline = deadline;
        this.#assignedTo = assignedTo;
        this.#createdBy = createdBy;
        this.#createdAt = createdAt;
        this.#updatedAt = updatedAt;
    }

    // ── Getters ────────────────────────────────────────────────

    get id()          { return this.#id; }
    get projectId()   { return this.#projectId; }
    get title()       { return this.#title; }
    get description() { return this.#description; }
    get status()      { return this.#status; }
    get deadline()    { return this.#deadline; }
    get assignedTo()  { return this.#assignedTo; }
    get createdBy()   { return this.#createdBy; }
    get createdAt()   { return this.#createdAt; }
    get updatedAt()   { return this.#updatedAt; }

    // ── Business methods ───────────────────────────────────────

    /**
     * Maps to classDiagram → Task.changeStatus()
     * Validates that the transition is allowed.
     * @param {string} newStatus
     * @returns {boolean} true if status was changed
     * @throws {Error} if transition is invalid
     */
    changeStatus(newStatus) {
        if (!Task.VALID_STATUSES.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}. Must be one of: ${Task.VALID_STATUSES.join(', ')}`);
        }

        const allowed = Task.STATUS_TRANSITIONS[this.#status];
        if (!allowed || !allowed.includes(newStatus)) {
            throw new Error(
                `Cannot transition from '${this.#status}' to '${newStatus}'. ` +
                `Allowed transitions: ${allowed ? allowed.join(', ') : 'none'}`
            );
        }

        this.#status = newStatus;
        this.#updatedAt = new Date().toISOString();
        return true;
    }

    /**
     * Checks whether this task is overdue.
     * @returns {boolean}
     */
    isOverdue() {
        if (!this.#deadline || this.#status === 'done') return false;
        return new Date(this.#deadline) < new Date();
    }

    // ── Serialisation ──────────────────────────────────────────

    toJSON() {
        return {
            id:          this.#id,
            projectId:   this.#projectId,
            title:       this.#title,
            description: this.#description,
            status:      this.#status,
            deadline:    this.#deadline,
            assignedTo:  this.#assignedTo,
            createdBy:   this.#createdBy,
            isOverdue:   this.isOverdue(),
            createdAt:   this.#createdAt,
            updatedAt:   this.#updatedAt,
        };
    }
}

module.exports = Task;
