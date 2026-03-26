import { PrismaClient } from '@prisma/client';
import { config } from '../config';

const globalForPrisma = global as unknown as { 
    prisma: PrismaClient | undefined
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: config.isDev ? ['query', 'error', 'warn'] : ['error'],
});

if (config.isDev) {
    globalForPrisma.prisma = prisma;
}