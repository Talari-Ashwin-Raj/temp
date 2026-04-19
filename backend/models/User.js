/**
 * User Model — Abstract Base Class
 * 
 * OOP Principle: ABSTRACTION & ENCAPSULATION
 * - Cannot be instantiated directly (abstract guard in constructor)
 * - Private fields (#) enforce encapsulation; external code uses getters only
 * - Subclasses (Admin, Manager, Member) MUST override getPermissions() and getRoleName()
 * 
 * OOP Principle: POLYMORPHISM (via overridable permission methods)
 * - canCreateProject(), canAssignTask(), canManageUsers(), etc.
 * - Each subclass provides its own truth table
 */

class User {
    #id;
    #username;
    #email;
    #passwordHash;
    #roleId;
    #createdAt;

    /**
     * @param {Object} params
     * @param {number}  params.id
     * @param {string}  params.username
     * @param {string}  params.email
     * @param {string}  params.passwordHash
     * @param {number}  params.roleId
     * @param {string}  params.createdAt
     */
    constructor({ id, username, email, passwordHash, roleId, createdAt }) {
        // Abstract class guard — prevents direct instantiation
        if (new.target === User) {
            throw new Error(
                'Cannot instantiate abstract class User directly. Use Admin, Manager, or Member.'
            );
        }

        this.#id = id;
        this.#username = username;
        this.#email = email;
        this.#passwordHash = passwordHash;
        this.#roleId = roleId;
        this.#createdAt = createdAt;
    }

    // ── Getters (Encapsulation) ────────────────────────────────

    get id()           { return this.#id; }
    get username()     { return this.#username; }
    get email()        { return this.#email; }
    get passwordHash() { return this.#passwordHash; }
    get roleId()       { return this.#roleId; }
    get createdAt()    { return this.#createdAt; }

    // ── Abstract methods (must be overridden) ──────────────────

    /**
     * Returns the human-readable role name.
     * @abstract
     * @returns {string}
     */
    getRoleName() {
        throw new Error('Subclass must implement getRoleName()');
    }

    /**
     * Returns a list of permission strings for this role.
     * @abstract
     * @returns {string[]}
     */
    getPermissions() {
        throw new Error('Subclass must implement getPermissions()');
    }

    // ── Polymorphic permission checks (overridden by subclasses) ─

    /** Can this user create new projects? */
    canCreateProject()    { return false; }

    /** Can this user assign tasks to members? */
    canAssignTask()       { return false; }

    /** Can this user manage (CRUD) other users? */
    canManageUsers()      { return false; }

    /** Can this user update a task's status? */
    canUpdateTaskStatus() { return true; }

    /** Can this user add comments to tasks? */
    canAddComment()       { return true; }

    /** Can this user delete a project? */
    canDeleteProject()    { return false; }

    // ── Serialisation ──────────────────────────────────────────

    /**
     * Safe JSON representation (excludes passwordHash).
     */
    toJSON() {
        return {
            id:        this.#id,
            username:  this.#username,
            email:     this.#email,
            role:      this.getRoleName(),
            roleId:    this.#roleId,
            permissions: this.getPermissions(),
            createdAt: this.#createdAt,
        };
    }
}

module.exports = User;
