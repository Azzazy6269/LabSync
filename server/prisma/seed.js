const {
  PrismaClient,
  Role,
  AccountStatus,
  OtpPurpose,
  ProjectStatus,
  DocType,
  RAGAccessLevel,
} = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const bcrypt = require('bcryptjs');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Helper to generate a valid 1536-dimension vector string for pgvector
function createMockEmbedding(seedValue = 0.01) {
  const vector = Array.from({ length: 1536 }, (_, i) =>
    Number((Math.sin(i + seedValue) * 0.1).toFixed(6))
  );
  return `[${vector.join(',')}]`;
}

async function main() {
  // Clean up tables in reverse dependency order to respect foreign key constraints
  await prisma.projectMessage.deleteMany({});
  await prisma.documentChunk.deleteMany({});
  await prisma.document.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.otp.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🌱 Starting database seeding...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const sampleOtpHash = await bcrypt.hash('482910', 10);

  // ==========================================
  // 1. SEED USERS
  // ==========================================
  console.log('🌱 Seeding Users...');

  const admin = await prisma.user.create({
    data: {
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

  const supervisor = await prisma.user.create({
    data: {
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

  const researcher1 = await prisma.user.create({
    data: {
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

  const googleUser = await prisma.user.create({
    data: {
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

  const pendingUser = await prisma.user.create({
    data: {
      email: 'pending.researcher@system.com',
      passwordHash: defaultPasswordHash,
      fullName: 'Mark Miller',
      phone: '+1234567894',
      nationalId: 'NAT-00000000005',
      jobTitle: 'Junior Researcher',
      role: Role.RESEARCHER,
      status: AccountStatus.PENDING_ADMIN_APPROVAL,
      isEmailVerified: false,
    },
  });

  const member = await prisma.user.create({
    data: {
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

  // ==========================================
  // 2. SEED OTPs
  // ==========================================
  console.log('🌱 Seeding OTPs...');

  await prisma.otp.createMany({
    data: [
      {
        userId: pendingUser.id,
        codeHash: sampleOtpHash,
        purpose: OtpPurpose.EMAIL_VERIFICATION,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // +15 mins
        attempts: 1,
      },
      {
        userId: researcher1.id,
        codeHash: sampleOtpHash,
        purpose: OtpPurpose.PASSWORD_RESET,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // +10 mins
        attempts: 0,
      },
    ],
  });

  // ==========================================
  // 3. SEED PROJECTS
  // ==========================================
  console.log('🌱 Seeding Projects...');

  // Project 1: PENDING_FINAL_APPROVAL (Holds the required FINAL_PAPER)
  const projectPendingFinal = await prisma.project.create({
    data: {
      title: 'JVM Memory Optimization & Garbage Collection Benchmarks',
      description:
        'An empirical study analyzing G1GC and ZGC latency spikes under high-throughput enterprise workloads.',
      field: 'Computer Science',
      status: ProjectStatus.PENDING_FINAL_APPROVAL,
      authorId: researcher1.id,
      supervisorId: supervisor.id,
    },
  });

  // Project 2: IN_PROGRESS
  const projectInProgress = await prisma.project.create({
    data: {
      title: 'Neural Protein Folding Acceleration via Sparse Attention',
      description:
        'Reducing transformer memory complexity for long-chain amino acid sequence modeling.',
      field: 'Bioinformatics',
      status: ProjectStatus.IN_PROGRESS,
      authorId: googleUser.id,
      supervisorId: supervisor.id,
    },
  });

  // Project 3: PUBLISHED
  const projectPublished = await prisma.project.create({
    data: {
      title: 'Automated Resume Parsing & Competency Graph Extraction',
      description:
        'NLP pipeline for extracting structured skill ontologies from unstructured academic CVs.',
      field: 'Artificial Intelligence',
      status: ProjectStatus.PUBLISHED,
      authorId: researcher1.id,
      supervisorId: supervisor.id,
    },
  });

  // Project 4: PENDING_SUPERVISOR_ACKNOWLEDGEMENT
  const projectPendingSupervisor = await prisma.project.create({
    data: {
      title: 'Quantum Error Correction in Cryogenic Control Systems',
      description:
        'Evaluating surface code thresholds under thermal noise fluctuations.',
      field: 'Physics',
      status: ProjectStatus.PENDING_SUPERVISOR_ACKNOWLEDGEMENT,
      authorId: googleUser.id,
      supervisorId: supervisor.id,
    },
  });

  // Project 5: REJECTED
  const projectRejected = await prisma.project.create({
    data: {
      title: 'Unverified Catalyst Synthesis Protocol',
      description: 'Preliminary proposal for low-temperature ammonia synthesis.',
      field: 'Chemistry',
      status: ProjectStatus.REJECTED,
      rejectionReason:
        'Missing signed university ethics & lab safety clearance documentation.',
      authorId: researcher1.id,
      supervisorId: null,
    },
  });

  // ==========================================
  // 4. SEED DOCUMENTS (Using all 8 local PDF files)
  // ==========================================
  console.log('🌱 Seeding Documents...');

  // --- Documents for Project 1 (PENDING_FINAL_APPROVAL) ---
  const docApproval1 = await prisma.document.create({
    data: {
      projectId: projectPendingFinal.id,
      uploadedById: researcher1.id,
      title: 'University Ethics & Lab Approval Form',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy_1794024143920-631846363.pdf',
      docType: DocType.UNIVERSITY_APPROVAL,
      version: 1,
    },
  });

  const docFee1 = await prisma.document.create({
    data: {
      projectId: projectPendingFinal.id,
      uploadedById: researcher1.id,
      title: 'Publication & Lab Processing Fee Receipt',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy_1794025402369-849694737.pdf',
      docType: DocType.FEE_RECEIPT,
      version: 1,
    },
  });

  const docDraft1 = await prisma.document.create({
    data: {
      projectId: projectPendingFinal.id,
      uploadedById: researcher1.id,
      title: 'Core Java & JVM Benchmarking - Initial Draft',
      fileUrl: '1_CoreJavaProgramming_Day1_1794108484824-988001975.pdf',
      docType: DocType.DRAFT_PAPER,
      version: 1,
    },
  });

  // Required: FINAL_PAPER belonging to PENDING_FINAL_APPROVAL project
  const docFinal1 = await prisma.document.create({
    data: {
      projectId: projectPendingFinal.id,
      uploadedById: researcher1.id,
      title: 'Core Java & JVM Benchmarking - Camera-Ready Final Paper',
      fileUrl: '1_CoreJavaProgramming_Day1_1794024532546-975030045.pdf',
      docType: DocType.FINAL_PAPER,
      version: 2,
    },
  });

  // --- Documents for Project 2 (IN_PROGRESS) ---
  const docApproval2 = await prisma.document.create({
    data: {
      projectId: projectInProgress.id,
      uploadedById: googleUser.id,
      title: 'Bioinformatics Departmental Approval',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy_1794107932721-732610772.pdf',
      docType: DocType.UNIVERSITY_APPROVAL,
      version: 1,
    },
  });

  const docDraft2 = await prisma.document.create({
    data: {
      projectId: projectInProgress.id,
      uploadedById: googleUser.id,
      title: 'Sparse Attention Architecture Working Draft',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy-resume_1794024143969-551873100.pdf',
      docType: DocType.DRAFT_PAPER,
      version: 1,
    },
  });

  // --- Documents for Project 3 (PUBLISHED) ---
  const docDraft3 = await prisma.document.create({
    data: {
      projectId: projectPublished.id,
      uploadedById: researcher1.id,
      title: 'Competency Graph Extraction - Pre-print Draft',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy-resume_1794025402447-794954844.pdf',
      docType: DocType.DRAFT_PAPER,
      version: 1,
    },
  });

  const docFinal3 = await prisma.document.create({
    data: {
      projectId: projectPublished.id,
      uploadedById: researcher1.id,
      title: 'Competency Graph Extraction - Published Final Paper',
      fileUrl: 'Mohammed_Ibrahim_Elazzazy-resume_1794107933386-9712717.pdf',
      docType: DocType.FINAL_PAPER,
      version: 2,
    },
  });

  // ==========================================
  // 5. SEED DOCUMENT CHUNKS (with pgvector embeddings)
  // ==========================================
  console.log('🌱 Seeding DocumentChunks & Vector Embeddings...');

  const chunkRecords = [
    {
      projectId: projectPendingFinal.id,
      documentId: docFinal1.id,
      content:
        'Abstract: We evaluate garbage collection pause times in modern Java Virtual Machines across heap sizes ranging from 4GB to 64GB.',
      accessLevel: RAGAccessLevel.PRIVATE_PROJECT,
      seed: 1.1,
    },
    {
      projectId: projectPendingFinal.id,
      documentId: docFinal1.id,
      content:
        'Methodology: Benchmarks were executed on isolated Linux nodes using JMH with deterministic allocation rates.',
      accessLevel: RAGAccessLevel.PRIVATE_PROJECT,
      seed: 2.2,
    },
    {
      projectId: projectInProgress.id,
      documentId: docDraft2.id,
      content:
        'Sparse attention masks reduce quadratic O(N^2) memory overhead when folding protein sequences exceeding 2,048 residues.',
      accessLevel: RAGAccessLevel.PRIVATE_PROJECT,
      seed: 3.3,
    },
    {
      projectId: projectPublished.id,
      documentId: docFinal3.id,
      content:
        'Global Lab Knowledge Base: Named Entity Recognition combined with taxonomy linking achieves 94.2% F1-score on academic CVs.',
      accessLevel: RAGAccessLevel.GLOBAL_LAB,
      seed: 4.4,
    },
  ];

  for (const item of chunkRecords) {
    const chunk = await prisma.documentChunk.create({
      data: {
        projectId: item.projectId,
        documentId: item.documentId,
        content: item.content,
        accessLevel: item.accessLevel,
      },
    });

    const vectorString = createMockEmbedding(item.seed);
    await prisma.$executeRawUnsafe(
      `UPDATE "DocumentChunk" SET embedding = $1::vector WHERE id = $2`,
      vectorString,
      chunk.id
    );
  }

  // ==========================================
  // 6. SEED PROJECT MESSAGES
  // ==========================================
  console.log('🌱 Seeding ProjectMessages...');

  // General discussion message
  await prisma.projectMessage.create({
    data: {
      projectId: projectPendingFinal.id,
      userId: researcher1.id,
      content:
        'Dr. Connor, I have uploaded the university approval and fee receipt alongside the initial draft.',
    },
  });

  // Message reviewing/commenting on a specific document (documentId)
  await prisma.projectMessage.create({
    data: {
      projectId: projectPendingFinal.id,
      userId: supervisor.id,
      documentId: docDraft1.id,
      content:
        'The benchmark methodology in v1 looks solid. Please expand Section 4 with ZGC tail-latency percentiles and upload the final camera-ready version.',
    },
  });

  // Message with an attached document (attachmentId - @unique)
  await prisma.projectMessage.create({
    data: {
      projectId: projectPendingFinal.id,
      userId: researcher1.id,
      attachmentId: docFinal1.id,
      content:
        'Updated with the ZGC percentile tables. Submitting the final paper for admin approval now.',
    },
  });

  // Message on Project 2 (IN_PROGRESS)
  await prisma.projectMessage.create({
    data: {
      projectId: projectInProgress.id,
      userId: googleUser.id,
      documentId: docDraft2.id,
      content:
        'Initial sparse attention draft is ready for weekly lab review.',
    },
  });

  console.log('✅ All tables seeded successfully!');
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