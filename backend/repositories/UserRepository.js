const prisma = require('../prisma/prismaClient');

class UserRepository {
  async findByEmail(email) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    return user ? this._format(user) : null;
  }

  async findByUsername(username) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    return user ? this._format(user) : null;
  }

  async findById(id) {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      include: { role: true },
    });
    return user ? this._format(user) : null;
  }

  async findAll() {
    const users = await prisma.user.findMany({
      include: { role: true },
    });
    return users.map(u => this._format(u));
  }

  async findByRole(roleName) {
    const users = await prisma.user.findMany({
      where: { role: { name: roleName } },
      include: { role: true },
    });
    return users.map(u => this._format(u));
  }

  async create(userData) {
    // We expect role_id to be passed directly or fetched by Service
    const user = await prisma.user.create({
      data: {
        username: userData.username,
        email: userData.email,
        password_hash: userData.password_hash,
        role_id: userData.role_id,
      },
      include: { role: true }
    });
    return this._format(user);
  }

  async updateRole(id, roleId) {
    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { role_id: roleId },
      include: { role: true }
    });
    return this._format(user);
  }

  async delete(id) {
    await prisma.user.delete({
      where: { id: parseInt(id) },
    });
    return true;
  }

  async getRoleByName(roleName) {
    return await prisma.role.findUnique({
      where: { name: roleName }
    });
  }

  // Format to match old output specs expected by Factory / Services
  _format(prismaUser) {
    return {
      ...prismaUser,
      role: prismaUser.role.name // Flattens nested role object into string as before
    };
  }
}

module.exports = UserRepository;
