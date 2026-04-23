import prisma from './prisma';

async function main() {
  const event = await prisma.event.create({
    data: {
      name: 'Global AI Hackathon 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    },
  });

  console.log('Created event:', event);

  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'admin123', // In production, this should be hashed
    },
  });

  console.log('Created/Updated admin:', admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
