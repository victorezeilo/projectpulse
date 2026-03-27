import { PrismaClient, WorkspaceRole, TaskStatus, TaskPriority, SprintStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // Clean existing data
  await prisma.activity.deleteMany();
  await prisma.timeEntry.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.label.deleteMany();
  await prisma.task.deleteMany();
  await prisma.sprint.deleteMany();
  await prisma.project.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const passwordHash = await bcrypt.hash('Password123', 12);

  const victor = await prisma.user.create({
    data: {
      name: 'Victor Ezeilo',
      email: 'victor@projectpulse.dev',
      passwordHash,
    },
  });

  const alice = await prisma.user.create({
    data: {
      name: 'Alice Johnson',
      email: 'alice@projectpulse.dev',
      passwordHash,
    },
  });

  const bob = await prisma.user.create({
    data: {
      name: 'Bob Smith',
      email: 'bob@projectpulse.dev',
      passwordHash,
    },
  });

  console.log('✅ Users created');

  // Create workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'ProjectPulse Team',
      slug: 'projectpulse-team',
      ownerId: victor.id,
      members: {
        create: [
          { userId: victor.id, role: WorkspaceRole.ADMIN },
          { userId: alice.id, role: WorkspaceRole.MEMBER },
          { userId: bob.id, role: WorkspaceRole.MEMBER },
        ],
      },
    },
  });

  console.log('✅ Workspace created');

  // Create project
  const project = await prisma.project.create({
    data: {
      workspaceId: workspace.id,
      name: 'ProjectPulse',
      description: 'AI-powered project management tool',
      key: 'PP',
    },
  });

  console.log('✅ Project created');

  // Create labels
  const labels = await Promise.all([
    prisma.label.create({ data: { projectId: project.id, name: 'frontend', color: '#3B82F6' } }),
    prisma.label.create({ data: { projectId: project.id, name: 'backend', color: '#10B981' } }),
    prisma.label.create({ data: { projectId: project.id, name: 'database', color: '#8B5CF6' } }),
    prisma.label.create({ data: { projectId: project.id, name: 'ai', color: '#F59E0B' } }),
    prisma.label.create({ data: { projectId: project.id, name: 'devops', color: '#6B7280' } }),
    prisma.label.create({ data: { projectId: project.id, name: 'bug', color: '#EF4444' } }),
  ]);

  console.log('✅ Labels created');

  // Create sprints
  const sprint1 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 1: Foundation',
      goal: 'Set up project infrastructure, implement authentication, and create workspace/project management foundation.',
      status: SprintStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const sprint2 = await prisma.sprint.create({
    data: {
      projectId: project.id,
      name: 'Sprint 2: Core Features',
      goal: 'Deliver the primary task management experience with a fully functional Kanban board and sprint workflow.',
      status: SprintStatus.PLANNED,
    },
  });

  console.log('✅ Sprints created');

  // Create tasks
  const tasks = [
    { title: 'User registration with email and password', status: TaskStatus.DONE, priority: TaskPriority.HIGH, storyPoints: 3, assigneeId: victor.id, sprintId: sprint1.id, taskNumber: 1 },
    { title: 'JWT login and token generation', status: TaskStatus.DONE, priority: TaskPriority.HIGH, storyPoints: 3, assigneeId: victor.id, sprintId: sprint1.id, taskNumber: 2 },
    { title: 'Create workspace', status: TaskStatus.IN_PROGRESS, priority: TaskPriority.HIGH, storyPoints: 5, assigneeId: victor.id, sprintId: sprint1.id, taskNumber: 3 },
    { title: 'Invite team members to workspace', status: TaskStatus.TODO, priority: TaskPriority.HIGH, storyPoints: 5, assigneeId: alice.id, sprintId: sprint1.id, taskNumber: 4 },
    { title: 'Assign workspace roles', status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, storyPoints: 3, assigneeId: alice.id, sprintId: sprint1.id, taskNumber: 5 },
    { title: 'Update user profile and avatar', status: TaskStatus.BACKLOG, priority: TaskPriority.LOW, storyPoints: 2, assigneeId: null, sprintId: null, taskNumber: 6 },
    { title: 'Create project with unique key', status: TaskStatus.TODO, priority: TaskPriority.HIGH, storyPoints: 5, assigneeId: victor.id, sprintId: sprint1.id, taskNumber: 7 },
    { title: 'Create and configure sprints', status: TaskStatus.BACKLOG, priority: TaskPriority.HIGH, storyPoints: 5, assigneeId: null, sprintId: sprint2.id, taskNumber: 8 },
    { title: 'Task CRUD with all fields', status: TaskStatus.BACKLOG, priority: TaskPriority.HIGH, storyPoints: 5, assigneeId: null, sprintId: sprint2.id, taskNumber: 9 },
    { title: 'Kanban board with drag-and-drop', status: TaskStatus.BACKLOG, priority: TaskPriority.HIGH, storyPoints: 8, assigneeId: null, sprintId: sprint2.id, taskNumber: 10 },
  ];

  for (let i = 0; i < tasks.length; i++) {
    const task = await prisma.task.create({
      data: {
        projectId: project.id,
        sprintId: tasks[i].sprintId,
        assigneeId: tasks[i].assigneeId,
        creatorId: victor.id,
        title: tasks[i].title,
        status: tasks[i].status,
        priority: tasks[i].priority,
        storyPoints: tasks[i].storyPoints,
        position: i,
        taskNumber: tasks[i].taskNumber,
      },
    });

    if (i < 3) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: labels[1].id },
      });
    }
    if (i === 9) {
      await prisma.taskLabel.create({
        data: { taskId: task.id, labelId: labels[0].id },
      });
    }
  }

  console.log('✅ Tasks created');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Email:    victor@projectpulse.dev');
  console.log('   Password: Password123\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });