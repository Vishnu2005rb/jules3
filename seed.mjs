import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.create({
    data: {
      name: 'Global AI Hackathon 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  });

  console.log('Created event:', event);

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Created/Updated admin with password123:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
