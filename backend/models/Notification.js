/**
 * Notification Model
 * 
 * Maps to the asynchronous notification in the Sequence Diagram:
 *   "API → Member: Push Notification: New Task Assigned"
 * 
 * Stored in DB and polled by the frontend.
 */

class Notification {
    #id;
    #userId;
    #message;
    #type;
    #referenceId;
    #isRead;
    #createdAt;

    /**
     * @param {Object} params
     */
    constructor({ id, userId, message, type, referenceId, isRead, createdAt }) {
        this.#id = id;
        this.#userId = userId;
        this.#message = message;
        this.#type = type || 'task_assigned';
        this.#referenceId = referenceId;
        this.#isRead = isRead || 0;
        this.#createdAt = createdAt;
    }

    // ── Getters ────────────────────────────────────────────────

    get id()          { return this.#id; }
    get userId()      { return this.#userId; }
    get message()     { return this.#message; }
    get type()        { return this.#type; }
    get referenceId() { return this.#referenceId; }
    get isRead()      { return Boolean(this.#isRead); }
    get createdAt()   { return this.#createdAt; }

    // ── Business methods ───────────────────────────────────────

    markAsRead() {
        this.#isRead = 1;
    }

    // ── Serialisation ──────────────────────────────────────────

    toJSON() {
        return {
            id:          this.#id,
            userId:      this.#userId,
            message:     this.#message,
            type:        this.#type,
            referenceId: this.#referenceId,
            isRead:      this.isRead,
            createdAt:   this.#createdAt,
        };
    }
}

module.exports = Notification;
