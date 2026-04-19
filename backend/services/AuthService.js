/**
 * AuthService
 * 
 * Design Pattern: SERVICE LAYER — centralises authentication business logic.
 * 
 * Handles:
 *   - User registration with password hashing
 *   - Login with credential verification
 *   - JWT token generation and verification
 * 
 * Maps to sequenceDiagram → "API → API: Validate Manager Permissions" (via JWT)
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserRepository = require('../repositories/UserRepository');
const UserFactory = require('../factories/UserFactory');

const JWT_SECRET = process.env.JWT_SECRET || 'taskhandler_jwt_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SALT_ROUNDS = 10;

class AuthService {
    #userRepository;

    constructor() {
        this.#userRepository = new UserRepository();
    }

    /**
     * Register a new user.
     * 
     * @param {Object} data
     * @param {string} data.username
     * @param {string} data.email
     * @param {string} data.password
     * @param {string} data.role - 'admin', 'manager', or 'member'
     * @returns {{ user: Object, token: string }}
     * @throws {Error} if email/username already exists
     */
    async register({ username, email, password, role }) {
        // Validate inputs
        if (!username || !email || !password) {
            throw new Error('Username, email, and password are required');
        }

        if (!role || !UserFactory.getValidRoles().includes(role.toLowerCase())) {
            throw new Error(`Invalid role. Must be one of: ${UserFactory.getValidRoles().join(', ')}`);
        }

        // Check for existing user
        const existingEmail = await this.#userRepository.findByEmail(email);
        if (existingEmail) {
            throw new Error('A user with this email already exists');
        }

        const existingUsername = await this.#userRepository.findByUsername(username);
        if (existingUsername) {
            throw new Error('A user with this username already exists');
        }

        // Hash password (Encapsulation — raw password never stored)
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        // Map role name to role_id
        const roleIdMap = { admin: 1, manager: 2, member: 3 };
        const roleId = roleIdMap[role.toLowerCase()];

        // Create user in DB
        const dbRow = await this.#userRepository.create({
            username,
            email,
            password_hash: passwordHash,
            role_id: roleId,
        });

        // Use Factory to create the correct User subclass
        const user = UserFactory.createFromDB(dbRow);

        // Generate JWT
        const token = this.#generateToken(user);

        return { user: user.toJSON(), token };
    }

    /**
     * Authenticate a user with email and password.
     * 
     * @param {Object} credentials
     * @param {string} credentials.email
     * @param {string} credentials.password
     * @returns {{ user: Object, token: string }}
     * @throws {Error} if credentials are invalid
     */
    async login({ email, password }) {
        if (!email || !password) {
            throw new Error('Email and password are required');
        }

        // Find user by email
        const dbRow = await this.#userRepository.findByEmail(email);
        if (!dbRow) {
            throw new Error('Invalid email or password');
        }

        // Verify password
        const isValid = await bcrypt.compare(password, dbRow.password_hash);
        if (!isValid) {
            throw new Error('Invalid email or password');
        }

        // Use Factory to create the correct subclass (Polymorphism)
        const user = UserFactory.createFromDB(dbRow);

        // Generate JWT
        const token = this.#generateToken(user);

        return { user: user.toJSON(), token };
    }

    /**
     * Verify a JWT token and return the user object.
     * 
     * @param {string} token
     * @returns {Admin|Manager|Member}
     * @throws {Error} if token is invalid or user not found
     */
    async verifyToken(token) {
        try {
            const payload = jwt.verify(token, JWT_SECRET);

            const dbRow = await this.#userRepository.findById(payload.userId);
            if (!dbRow) {
                throw new Error('User not found');
            }

            return UserFactory.createFromDB(dbRow);
        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw new Error('Token has expired');
            }
            if (err.name === 'JsonWebTokenError') {
                throw new Error('Invalid token');
            }
            throw err;
        }
    }

    /**
     * Generate a JWT for a user.
     * @private
     * @param {User} user
     * @returns {string}
     */
    #generateToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                username: user.username,
                role: user.getRoleName(),
                roleId: user.roleId,
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }
}

module.exports = AuthService;
