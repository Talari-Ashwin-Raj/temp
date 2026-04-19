const prisma = require('../prisma/prismaClient');

class TaskRepository {
  async create(taskData) {
    const task = await prisma.task.create({
      data: {
        project_id: taskData.project_id,
        title: taskData.title,
        description: taskData.description,
        status: taskData.status || 'todo',
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        assigned_to: taskData.assigned_to,
        created_by: taskData.created_by,
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return this._format(task);
  }

  async findById(id) {
    const task = await prisma.task.findUnique({
      where: { id: parseInt(id) },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return task ? this._format(task) : null;
  }

  async findAllByUserId(userId) {
    const tasks = await prisma.task.findMany({
      where: { assigned_to: parseInt(userId) },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return tasks.map(t => this._format(t));
  }

  async findAllByProjectId(projectId) {
    const tasks = await prisma.task.findMany({
      where: { project_id: parseInt(projectId) },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return tasks.map(t => this._format(t));
  }

  async findAll() {
     const tasks = await prisma.task.findMany({
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return tasks.map(t => this._format(t));
  }

  async update(id, taskData) {
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: {
        title: taskData.title,
        description: taskData.description,
        deadline: taskData.deadline ? new Date(taskData.deadline) : null,
        assigned_to: taskData.assigned_to
      },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return this._format(task);
  }

  async updateStatus(id, status) {
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        project: { select: { title: true } },
        assignee: { select: { username: true } },
        creator: { select: { username: true } }
      }
    });
    return this._format(task);
  }

  async delete(id) {
    await prisma.task.delete({
      where: { id: parseInt(id) }
    });
    return true;
  }

  // Format matches exactly the raw SQL outputs returned via JOINs earlier
  _format(prismaTask) {
    return {
      ...prismaTask,
      project_title: prismaTask.project?.title,
      assigned_to_name: prismaTask.assignee?.username,
      created_by_name: prismaTask.creator?.username
    };
  }
}

module.exports = TaskRepository;
