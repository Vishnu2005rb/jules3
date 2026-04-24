import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. Create Form Template
  const formTemplate = await prisma.formTemplate.create({
    data: {
      name: 'Standard Hackathon Form',
      fields: [
        { name: 'githubUrl', label: 'GitHub Profile', type: 'url', required: true },
        { name: 'discordTag', label: 'Discord Tag', type: 'text', required: true },
        { name: 'teamName', label: 'Team Name', type: 'text', required: false }
      ]
    }
  });

  // 2. Create Certificate Template
  const certTemplate = await prisma.certificateTemplate.create({
    data: {
      name: 'Modern Purple Layout',
      config: {
        primaryColor: '#a855f7',
        secondaryColor: '#3b82f6',
        fontFamily: 'Helvetica',
        elements: [
          { type: 'text', content: 'CERTIFICATE OF EXCELLENCE', fontSize: 30, y: 700 },
          { type: 'text', content: 'This is to certify that', fontSize: 16, y: 600 },
          { type: 'name', fontSize: 40, y: 530 },
          { type: 'text', content: 'has successfully completed the', fontSize: 16, y: 460 },
          { type: 'event', fontSize: 24, y: 400 },
          { type: 'qr', size: 80, x: 250, y: 150 }
        ]
      }
    }
  });

  // 3. Create Event
  const event = await prisma.event.create({
    data: {
      name: 'AI Innovation Summit 2024',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      formTemplateId: formTemplate.id,
      certificateTemplateId: certTemplate.id
    },
  });

  console.log('Created event with templates:', event.name);

  // 4. Upsert Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.admin.upsert({
    where: { username: 'admin' },
    update: { password: hashedPassword },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Admin user "admin" updated with password "admin123"');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
