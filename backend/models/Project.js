/**
 * Project Model
 * 
 * OOP Principle: ENCAPSULATION — private fields with controlled accessors
 * 
 * Maps to classDiagram → Project class and ErDiagram → PROJECTS table.
 * A Project contains many Tasks (composition relationship).
 */

class Project {
    #id;
    #title;
    #description;
    #managerId;
    #createdAt;

    /**
     * @param {Object} params
     * @param {number}  params.id
     * @param {string}  params.title
     * @param {string}  params.description
     * @param {number}  params.managerId
     * @param {string}  params.createdAt
     */
    constructor({ id, title, description, managerId, createdAt }) {
        this.#id = id;
        this.#title = title;
        this.#description = description;
        this.#managerId = managerId;
        this.#createdAt = createdAt;
    }

    // ── Getters ────────────────────────────────────────────────

    get id()          { return this.#id; }
    get title()       { return this.#title; }
    get description() { return this.#description; }
    get managerId()   { return this.#managerId; }
    get createdAt()   { return this.#createdAt; }

    // ── Setters (controlled mutation) ──────────────────────────

    set title(value) {
        if (!value || typeof value !== 'string') {
            throw new Error('Project title must be a non-empty string');
        }
        this.#title = value;
    }

    set description(value) {
        this.#description = value;
    }

    set managerId(value) {
        this.#managerId = value;
    }

    // ── Business methods ───────────────────────────────────────

    /**
     * Maps to classDiagram → Project.addMember()
     * Actual DB operation is handled by ProjectRepository;
     * this method validates the intent.
     * @param {number} userId
     * @returns {Object}
     */
    addMember(userId) {
        return { projectId: this.#id, userId };
    }

    // ── Serialisation ──────────────────────────────────────────

    toJSON() {
        return {
            id:          this.#id,
            title:       this.#title,
            description: this.#description,
            managerId:   this.#managerId,
            createdAt:   this.#createdAt,
        };
    }
}

module.exports = Project;
