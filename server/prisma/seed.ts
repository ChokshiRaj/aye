import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@aye.com';
  
  // Clean up existing demo data if needed to allow clean re-seeding
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('Demo user already exists. Skipping seed.');
    return;
  }

  console.log('Seeding demo database...');

  // Hash password
  const passwordHash = await bcrypt.hash('Password123', 12);

  // Create user with related widgets data
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Demo User',
      passwordHash,
      settings: {
        create: {
          city: 'Vadodara',
          timezone: 'Asia/Kolkata',
          stockTickers: ['NIFTY', 'RELIANCE', 'TCS'],
        },
      },
      todos: {
        create: [
          { text: 'Explore the AYE Dashboard', done: false },
          { text: 'Add a custom bookmark', done: true },
          { text: 'Set up weather for your city', done: false },
        ],
      },
      notes: {
        create: {
          content: '# Welcome to your AYE Notes!\n\nThis is a simple markdown-supported note card that saves automatically as you type.\n\n### Features:\n- Persistent data\n- Auto-saves on blur\n- Access it from anywhere',
        },
      },
      habits: {
        create: [
          { name: 'Drink 3L Water' },
          { name: 'Read for 20 mins' },
          { name: 'Exercise / Workout' },
        ],
      },
      bookmarks: {
        create: [
          { name: 'Google', url: 'https://google.com', icon: 'Search' },
          { name: 'GitHub', url: 'https://github.com', icon: 'Github' },
          { name: 'Vercel', url: 'https://vercel.com', icon: 'ExternalLink' },
        ],
      },
    },
    include: {
      habits: true,
    },
  });

  // Seed habit logs for the last 3 days for demo purposes
  const today = new Date();
  for (const habit of user.habits) {
    // Log for yesterday and 2 days ago
    const date1 = new Date();
    date1.setDate(today.getDate() - 1);
    const date2 = new Date();
    date2.setDate(today.getDate() - 2);

    await prisma.habitLog.createMany({
      data: [
        {
          date: new Date(date1.toISOString().split('T')[0]),
          habitId: habit.id,
          userId: user.id,
        },
        {
          date: new Date(date2.toISOString().split('T')[0]),
          habitId: habit.id,
          userId: user.id,
        },
      ],
    });
  }

  console.log('Seeding completed successfully!');
  console.log(`Demo login: Email: "${email}", Password: "Password123"`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
