import { prisma } from './prisma';
const bcrypt = require('bcryptjs');

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Created/Updated admin with hashed password:', admin.username);

  const event = await prisma.event.upsert({
    where: { id: 'default-event-id' },
    update: {},
    create: {
      id: 'default-event-id',
      name: 'Global AI Hackathon 2024',
      eventCode: 'GLOBAL2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  });
  console.log('Created default event:', event.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
