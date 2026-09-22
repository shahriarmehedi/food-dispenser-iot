import { PrismaClient, AccountStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Initial System Configurations
  const configs = [
    { key: 'PRICE_PER_GRAM', value: '0.50', description: 'Price in BDT charged per gram of food' },
    { key: 'MIN_BALANCE_THRESHOLD', value: '10.00', description: 'Minimum balance required to unlock dispenser' },
    { key: 'WEIGHT_NOISE_THRESHOLD', value: '5.00', description: 'Differential weight under this gram value is ignored' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  // 2. Demo Students for Testing
  const students = [
    {
      cardUid: '43A1B2C3',
      studentId: '2003001',
      name: 'Shahriar Mehedi',
      department: 'CSE',
      balance: 350.00,
      status: AccountStatus.ACTIVE,
    },
    {
      cardUid: '99F8D7E6',
      studentId: '2003002',
      name: 'Rahim Ahmed',
      department: 'EEE',
      balance: 8.50, // Low balance for testing 403 response
      status: AccountStatus.ACTIVE,
    },
    {
      cardUid: '11223344',
      studentId: '2003003',
      name: 'Tanvir Islam',
      department: 'ME',
      balance: 150.00,
      status: AccountStatus.SUSPENDED, // Suspended test
    },
  ];

  for (const student of students) {
    await prisma.student.upsert({
      where: { cardUid: student.cardUid },
      update: {
        name: student.name,
        department: student.department,
        balance: student.balance,
        status: student.status,
      },
      create: student,
    });
  }

  console.log('Seed completed: Configurations and Demo Students created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
