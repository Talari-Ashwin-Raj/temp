const prisma = require('../prisma/prismaClient');

class ProjectRepository {
  async create(projectData) {
    const project = await prisma.project.create({
      data: {
        title: projectData.title,
        description: projectData.description,
        manager_id: projectData.manager_id,
      }
    });
    return project;
  }

  async findById(id) {
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) },
    });
    return project;
  }

  async findAll() {
    // Old implementation included a member count lookup
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    return projects.map(p => ({
      ...p,
      memberCount: p._count.members
    }));
  }

  async findAllByUserId(userId) {
    // Retrieve projects the user manages OR is a member of.
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { manager_id: parseInt(userId) },
          { members: { some: { user_id: parseInt(userId) } } }
        ]
      },
      include: {
        _count: {
          select: { members: true }
        }
      }
    });

    return projects.map(p => ({
      ...p,
      memberCount: p._count.members
    }));
  }

  async update(id, projectData) {
    return await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        title: projectData.title,
        description: projectData.description,
      }
    });
  }

  async delete(id) {
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });
    return true;
  }

  async addMember(projectId, userId) {
    return await prisma.projectMember.create({
      data: {
        project_id: parseInt(projectId),
        user_id: parseInt(userId),
      }
    });
  }

  async removeMember(projectId, userId) {
    await prisma.projectMember.delete({
      where: {
        project_id_user_id: {
            project_id: parseInt(projectId),
            user_id: parseInt(userId)
        }
      }
    });
    return true;
  }

  async getMembers(projectId) {
    const members = await prisma.projectMember.findMany({
      where: { project_id: parseInt(projectId) },
      include: { user: true }
    });

    return members.map(m => m.user);
  }

  async isMember(projectId, userId) {
    const membership = await prisma.projectMember.findUnique({
      where: {
        project_id_user_id: {
            project_id: parseInt(projectId),
            user_id: parseInt(userId)
        }
      }
    });
    return !!membership;
  }
}

module.exports = ProjectRepository;
