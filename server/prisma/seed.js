const { PrismaClient, Role, AccountStatus } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.deleteMany({});
  
  console.log('🌱 Starting database seeding...');

  // Hashing password
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  console.log(`🌱 Seeding Users Data`);

  // 1. Create System Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@system.com' },
    update: {},
    create: {
      email: 'admin@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'System Administrator',
      phone: '+1234567890',
      nationalId: 'NAT-00000000001',
      jobTitle: 'Head Administrator',
      role: Role.ADMIN,
      status: AccountStatus.APPROVED,
      isEmailVerified: true,
      metadata: { department: 'IT Operations' },
    },
  });

  // 2. Create Supervisor (Approved by Admin)
  const supervisor = await prisma.user.upsert({
    where: { email: 'supervisor@system.com' },
    update: {},
    create: {
      email: 'supervisor@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Dr. Sarah Connor',
      phone: '+1234567891',
      nationalId: 'NAT-00000000002',
      nationalIdCard: 'https://storage.example.com/cards/supervisor.pdf',
      jobTitle: 'Research Director',
      role: Role.SUPERVISOR,
      status: AccountStatus.APPROVED,
      isEmailVerified: true,
      approvedById: admin.id,
      metadata: { department: 'Biotechnology' },
    },
  });

  // 3. Create Approved Researcher (Approved by Admin)
  const researcher1 = await prisma.user.upsert({
    where: { email: 'researcher1@system.com' },
    update: {},
    create: {
      email: 'researcher1@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Alex Vance',
      phone: '+1234567892',
      nationalId: 'NAT-00000000003',
      nationalIdCard: 'https://storage.example.com/cards/researcher1.pdf',
      jobTitle: 'Senior Data Scientist',
      role: Role.RESEARCHER,
      status: AccountStatus.APPROVED,
      isEmailVerified: true,
      approvedById: admin.id,
      metadata: { focusArea: 'AI Models' },
    },
  });

  // 4. Create OAuth Google User (Approved, no passwordHash)
  const googleUser = await prisma.user.upsert({
    where: { email: 'google.user@gmail.com' },
    update: {},
    create: {
      email: 'google.user@gmail.com',
      googleId: 'google-oauth-sub-123456789',
      fullName: 'Jane Google',
      phone: '+1234567893',
      nationalId: 'NAT-00000000004',
      jobTitle: 'Research Fellow',
      role: Role.RESEARCHER,
      status: AccountStatus.APPROVED,
      isEmailVerified: true,
      approvedById: admin.id,
    },
  });

// 5. Create Pending Researcher (Awaiting Admin Approval)
  const pendingUser = await prisma.user.upsert({
    where: { email: 'pending.researcher@system.com' },
    update: {},
    create: {
      email: 'pending.researcher@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Mark Miller',
      phone: '+1234567894',
      nationalId: 'NAT-00000000005',
      jobTitle: 'Junior Researcher',
      role: Role.RESEARCHER,
      status: AccountStatus.PENDING_ADMIN_APPROVAL,
      isEmailVerified: true,
    },
  });

  // 6. Create Standard Member
  const member = await prisma.user.upsert({
    where: { email: 'member@system.com' },
    update: {},
    create: {
      email: 'member@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'John Doe',
      phone: '+1234567895',
      nationalId: 'NAT-00000000006',
      jobTitle: 'Assistant',
      role: Role.MEMBER,
      status: AccountStatus.APPROVED,
      isEmailVerified: true,
      approvedById: admin.id,
    },
  });
  
  console.log('✅ Users Seed finished successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });