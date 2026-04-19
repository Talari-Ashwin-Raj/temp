const { PrismaClient } = require('@prisma/client');

/**
 * Prisma singleton client definition.
 * Eliminates open DB connections draining Node memory by leveraging instances properly.
 */
let prisma;

if (!global.prisma) {
  global.prisma = new PrismaClient();
}
prisma = global.prisma;

module.exports = prisma;
