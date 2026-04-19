const prisma = require('../prisma/prismaClient');

class CommentRepository {
  async create(commentData) {
    const comment = await prisma.comment.create({
      data: {
        task_id: commentData.task_id,
        user_id: commentData.user_id,
        message: commentData.message,
      },
      include: {
        user: { 
            include: { role: true } 
        }
      }
    });
    return this._format(comment);
  }

  async findById(id) {
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: { 
            include: { role: true } 
        }
      }
    });
    return comment ? this._format(comment) : null;
  }

  async findAllByTaskId(taskId) {
    const comments = await prisma.comment.findMany({
      where: { task_id: parseInt(taskId) },
      orderBy: { created_at: 'asc' },
      include: {
        user: { 
            include: { role: true } 
        }
      }
    });
    return comments.map(c => this._format(c));
  }

  async delete(id) {
    await prisma.comment.delete({
      where: { id: parseInt(id) }
    });
    return true;
  }

  // Flattens the nested user relational lookup into what the controller expects
  _format(prismaComment) {
    return {
        ...prismaComment,
        author_name: prismaComment.user?.username,
        author_role: prismaComment.user?.role?.name
    };
  }
}

module.exports = CommentRepository;
