/**
 * Seed Script
 * 
 * Populates the database with sample data for testing:
 *   - 1 Admin, 2 Managers, 4 Members
 *   - 3 Projects with team assignments
 *   - Multiple tasks across projects with various statuses
 *   - Sample comments
 *   - Sample notifications
 * 
 * All passwords are hashed with bcrypt. Default password: "password123"
 * 
 * Run: npm run seed
 */

const bcrypt = require('bcryptjs');
const DatabaseConnection = require('../db/database');

async function seed() {
    console.log('🌱 Seeding database...\n');

    const db = DatabaseConnection.getInstance().getConnection();

    // ── Clear existing data ────────────────────────────────────
    db.exec(`
        DELETE FROM notifications;
        DELETE FROM comments;
        DELETE FROM tasks;
        DELETE FROM project_members;
        DELETE FROM projects;
        DELETE FROM users;
    `);

    // Reset auto-increment counters
    db.exec(`
        DELETE FROM sqlite_sequence WHERE name IN ('users', 'projects', 'tasks', 'comments', 'project_members', 'notifications');
    `);

    const passwordHash = await bcrypt.hash('password123', 10);

    // ── Create Users ───────────────────────────────────────────
    const insertUser = db.prepare(
        `INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)`
    );

    const users = [
        { username: 'admin',         email: 'admin@taskhandler.com',     roleId: 1 },
        { username: 'john_manager',  email: 'john@taskhandler.com',      roleId: 2 },
        { username: 'sarah_manager', email: 'sarah@taskhandler.com',     roleId: 2 },
        { username: 'alice_member',  email: 'alice@taskhandler.com',     roleId: 3 },
        { username: 'bob_member',    email: 'bob@taskhandler.com',       roleId: 3 },
        { username: 'carol_member',  email: 'carol@taskhandler.com',     roleId: 3 },
        { username: 'dave_member',   email: 'dave@taskhandler.com',      roleId: 3 },
    ];

    const insertUsers = db.transaction(() => {
        for (const u of users) {
            insertUser.run(u.username, u.email, passwordHash, u.roleId);
        }
    });
    insertUsers();

    console.log('✅ Users created:');
    users.forEach((u, i) => {
        const roles = { 1: 'Admin', 2: 'Manager', 3: 'Member' };
        console.log(`   ${i + 1}. ${u.username} (${roles[u.roleId]}) — ${u.email}`);
    });

    // ── Create Projects ────────────────────────────────────────
    const insertProject = db.prepare(
        `INSERT INTO projects (title, description, manager_id) VALUES (?, ?, ?)`
    );

    const projects = [
        { title: 'E-Commerce Platform',    description: 'Build a modern online shopping platform with cart, checkout, and payment integration.', managerId: 2 },
        { title: 'Mobile Banking App',     description: 'Develop a secure mobile banking application with transaction tracking and alerts.', managerId: 2 },
        { title: 'AI Chatbot Integration', description: 'Integrate an AI-powered chatbot for customer support across all platforms.', managerId: 3 },
    ];

    const insertProjects = db.transaction(() => {
        for (const p of projects) {
            insertProject.run(p.title, p.description, p.managerId);
        }
    });
    insertProjects();

    console.log('\n✅ Projects created:');
    projects.forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.title} (Manager ID: ${p.managerId})`);
    });

    // ── Add Project Members ────────────────────────────────────
    const insertMember = db.prepare(
        `INSERT INTO project_members (project_id, user_id) VALUES (?, ?)`
    );

    const memberships = [
        // Project 1: E-Commerce — John manages, Alice & Bob work
        { projectId: 1, userId: 2 },  // john_manager
        { projectId: 1, userId: 4 },  // alice_member
        { projectId: 1, userId: 5 },  // bob_member
        // Project 2: Mobile Banking — John manages, Carol & Dave work
        { projectId: 2, userId: 2 },  // john_manager
        { projectId: 2, userId: 6 },  // carol_member
        { projectId: 2, userId: 7 },  // dave_member
        // Project 3: AI Chatbot — Sarah manages, Alice & Carol work
        { projectId: 3, userId: 3 },  // sarah_manager
        { projectId: 3, userId: 4 },  // alice_member
        { projectId: 3, userId: 6 },  // carol_member
    ];

    const insertMembers = db.transaction(() => {
        for (const m of memberships) {
            insertMember.run(m.projectId, m.userId);
        }
    });
    insertMembers();

    console.log('\n✅ Project memberships assigned');

    // ── Create Tasks ───────────────────────────────────────────
    const insertTask = db.prepare(
        `INSERT INTO tasks (project_id, title, description, status, deadline, assigned_to, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`
    );

    const tasks = [
        // Project 1: E-Commerce
        { projectId: 1, title: 'Design product listing page',        description: 'Create responsive UI for product grid with filters and sorting', status: 'done',        deadline: '2026-04-25', assignedTo: 4, createdBy: 2 },
        { projectId: 1, title: 'Implement shopping cart API',        description: 'Build REST endpoints for add/remove/update cart items',         status: 'in_progress', deadline: '2026-04-28', assignedTo: 5, createdBy: 2 },
        { projectId: 1, title: 'Set up payment gateway',             description: 'Integrate Stripe for secure checkout flow',                    status: 'todo',        deadline: '2026-05-05', assignedTo: 4, createdBy: 2 },
        { projectId: 1, title: 'Write unit tests for cart service',  description: 'Cover edge cases: empty cart, max quantity, expired items',     status: 'todo',        deadline: '2026-05-10', assignedTo: 5, createdBy: 2 },

        // Project 2: Mobile Banking
        { projectId: 2, title: 'Design authentication screens',      description: 'Login, registration, and 2FA screens for mobile app',          status: 'done',        deadline: '2026-04-20', assignedTo: 6, createdBy: 2 },
        { projectId: 2, title: 'Build transaction history API',      description: 'Paginated API endpoint returning transaction records',          status: 'in_progress', deadline: '2026-04-30', assignedTo: 7, createdBy: 2 },
        { projectId: 2, title: 'Implement push notifications',       description: 'Real-time alerts for deposits, withdrawals, and alerts',        status: 'todo',        deadline: '2026-05-08', assignedTo: 6, createdBy: 2 },

        // Project 3: AI Chatbot
        { projectId: 3, title: 'Research NLP frameworks',             description: 'Evaluate Dialogflow, Rasa, and OpenAI for chatbot engine',     status: 'done',        deadline: '2026-04-18', assignedTo: 4, createdBy: 3 },
        { projectId: 3, title: 'Build chatbot training pipeline',    description: 'Create data pipeline for training the conversational model',    status: 'in_progress', deadline: '2026-05-01', assignedTo: 6, createdBy: 3 },
        { projectId: 3, title: 'Integrate chat widget into website', description: 'Embed the chatbot as a floating widget on the main site',       status: 'todo',        deadline: '2026-05-12', assignedTo: 4, createdBy: 3 },
    ];

    const insertTasks = db.transaction(() => {
        for (const t of tasks) {
            insertTask.run(t.projectId, t.title, t.description, t.status, t.deadline, t.assignedTo, t.createdBy);
        }
    });
    insertTasks();

    console.log(`\n✅ ${tasks.length} tasks created across ${projects.length} projects`);

    // ── Create Comments ────────────────────────────────────────
    const insertComment = db.prepare(
        `INSERT INTO comments (task_id, user_id, message) VALUES (?, ?, ?)`
    );

    const comments = [
        { taskId: 1, userId: 4, message: 'Completed the responsive grid layout. Ready for review.' },
        { taskId: 1, userId: 2, message: 'Looks great! Approved and merged.' },
        { taskId: 2, userId: 5, message: 'Working on the add-to-cart endpoint. Should be done by tomorrow.' },
        { taskId: 2, userId: 2, message: 'Make sure to handle quantity validation.' },
        { taskId: 5, userId: 6, message: 'Auth screens are ready. Added biometric login support too.' },
        { taskId: 8, userId: 4, message: 'After evaluation, I recommend using OpenAI API for flexibility.' },
        { taskId: 8, userId: 3, message: 'Agreed. Let\'s proceed with OpenAI. Good research!' },
        { taskId: 9, userId: 6, message: 'Pipeline is 60% complete. Working on data preprocessing.' },
    ];

    const insertComments = db.transaction(() => {
        for (const c of comments) {
            insertComment.run(c.taskId, c.userId, c.message);
        }
    });
    insertComments();

    console.log(`✅ ${comments.length} comments created`);

    // ── Create Notifications ───────────────────────────────────
    const insertNotification = db.prepare(
        `INSERT INTO notifications (user_id, message, type, reference_id, is_read) VALUES (?, ?, ?, ?, ?)`
    );

    const notifications = [
        { userId: 4, message: 'New task assigned: "Design product listing page" in project "E-Commerce Platform"',        type: 'task_assigned', refId: 1, isRead: 1 },
        { userId: 5, message: 'New task assigned: "Implement shopping cart API" in project "E-Commerce Platform"',         type: 'task_assigned', refId: 2, isRead: 0 },
        { userId: 4, message: 'New task assigned: "Set up payment gateway" in project "E-Commerce Platform"',              type: 'task_assigned', refId: 3, isRead: 0 },
        { userId: 6, message: 'New task assigned: "Build chatbot training pipeline" in project "AI Chatbot Integration"',  type: 'task_assigned', refId: 9, isRead: 0 },
        { userId: 2, message: 'Task "Design product listing page" status changed to "done" by alice_member',               type: 'status_change', refId: 1, isRead: 1 },
    ];

    const insertNotifications = db.transaction(() => {
        for (const n of notifications) {
            insertNotification.run(n.userId, n.message, n.type, n.refId, n.isRead);
        }
    });
    insertNotifications();

    console.log(`✅ ${notifications.length} notifications created`);

    // ── Summary ────────────────────────────────────────────────
    console.log('\n' + '═'.repeat(55));
    console.log('  🎉 Database seeded successfully!');
    console.log('═'.repeat(55));
    console.log('\n  Login credentials (all passwords: "password123"):');
    console.log('  ─────────────────────────────────────────────────');
    console.log('  Admin:    admin@taskhandler.com');
    console.log('  Manager:  john@taskhandler.com');
    console.log('  Manager:  sarah@taskhandler.com');
    console.log('  Member:   alice@taskhandler.com');
    console.log('  Member:   bob@taskhandler.com');
    console.log('  Member:   carol@taskhandler.com');
    console.log('  Member:   dave@taskhandler.com');
    console.log('');

    DatabaseConnection.getInstance().close();
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
