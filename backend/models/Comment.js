/**
 * Comment Model
 * 
 * OOP Principle: ENCAPSULATION — private fields with controlled accessors
 * 
 * Maps to classDiagram → Comment class and ErDiagram → COMMENTS table.
 * Comments belong to a Task (composition relationship).
 */

class Comment {
    #id;
    #taskId;
    #userId;
    #message;
    #createdAt;

    /**
     * @param {Object} params
     * @param {number}  params.id
     * @param {number}  params.taskId
     * @param {number}  params.userId
     * @param {string}  params.message
     * @param {string}  params.createdAt
     */
    constructor({ id, taskId, userId, message, createdAt }) {
        this.#id = id;
        this.#taskId = taskId;
        this.#userId = userId;
        this.#message = message;
        this.#createdAt = createdAt;
    }

    // ── Getters ────────────────────────────────────────────────

    get id()        { return this.#id; }
    get taskId()    { return this.#taskId; }
    get userId()    { return this.#userId; }
    get message()   { return this.#message; }
    get createdAt() { return this.#createdAt; }

    // ── Serialisation ──────────────────────────────────────────

    toJSON() {
        return {
            id:        this.#id,
            taskId:    this.#taskId,
            userId:    this.#userId,
            message:   this.#message,
            createdAt: this.#createdAt,
        };
    }
}

module.exports = Comment;
