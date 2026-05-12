import { PrismaClient, Role, EmploymentStatus, LeaveType, LeaveStatus, ConversationType } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.file.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationParticipant.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.leaveRequest.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // Create departments first (no head yet)
  const [engineering, hr, operations] = await Promise.all([
    prisma.department.create({ data: { name: "Engineering", description: "Software development and infrastructure" } }),
    prisma.department.create({ data: { name: "Human Resources", description: "People operations and talent management" } }),
    prisma.department.create({ data: { name: "Operations", description: "Business operations and logistics" } }),
  ]);

  // Create Admin
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@hrflow.com",
      password: await hash("admin123", 12),
      role: Role.ADMIN,
      employee: {
        create: {
          position: "System Administrator",
          status: EmploymentStatus.ACTIVE,
          dateJoined: new Date("2022-01-01"),
          departmentId: operations.id,
        },
      },
    },
    include: { employee: true },
  });

  // Create HR Manager
  const hrUser = await prisma.user.create({
    data: {
      name: "Sarah Johnson",
      email: "hr@hrflow.com",
      password: await hash("hr123", 12),
      role: Role.HR_MANAGER,
      employee: {
        create: {
          position: "HR Manager",
          phone: "+2348012345678",
          status: EmploymentStatus.ACTIVE,
          dateJoined: new Date("2022-03-15"),
          departmentId: hr.id,
        },
      },
    },
    include: { employee: true },
  });

  // Create 5 employees
  const employeeData = [
    { name: "Chukwuemeka Okafor", email: "emeka@hrflow.com", position: "Senior Software Engineer", dept: engineering.id, joined: "2022-06-01", phone: "+2348023456789" },
    { name: "Fatima Al-Hassan", email: "fatima@hrflow.com", position: "Frontend Developer", dept: engineering.id, joined: "2023-01-10", phone: "+2348034567890" },
    { name: "David Mensah", email: "david@hrflow.com", position: "DevOps Engineer", dept: engineering.id, joined: "2023-04-20", phone: "+2348045678901" },
    { name: "Amaka Eze", email: "amaka@hrflow.com", position: "Operations Lead", dept: operations.id, joined: "2022-09-05", phone: "+2348056789012" },
    { name: "Tunde Adebayo", email: "tunde@hrflow.com", position: "Operations Analyst", dept: operations.id, joined: "2023-07-15", phone: "+2348067890123" },
  ];

  const employees = await Promise.all(
    employeeData.map(async (e) =>
      prisma.user.create({
        data: {
          name: e.name,
          email: e.email,
          password: await hash("password123", 12),
          role: Role.EMPLOYEE,
          employee: {
            create: {
              position: e.position,
              phone: e.phone,
              status: EmploymentStatus.ACTIVE,
              dateJoined: new Date(e.joined),
              departmentId: e.dept,
            },
          },
        },
        include: { employee: true },
      })
    )
  );

  // Set department heads
  await Promise.all([
    prisma.department.update({ where: { id: engineering.id }, data: { headId: employees[0].employee!.id } }),
    prisma.department.update({ where: { id: hr.id }, data: { headId: hrUser.employee!.id } }),
    prisma.department.update({ where: { id: operations.id }, data: { headId: employees[3].employee!.id } }),
  ]);

  // Create attendance records (last 7 days)
  const allEmployeeIds = [
    adminUser.employee!.id,
    hrUser.employee!.id,
    ...employees.map((e) => e.employee!.id),
  ];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 1; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const clockIn = new Date(date);
    clockIn.setHours(8, 30 + Math.floor(Math.random() * 30), 0, 0);
    const clockOut = new Date(date);
    clockOut.setHours(17, Math.floor(Math.random() * 30), 0, 0);

    // 80% attendance
    const presentIds = allEmployeeIds.filter(() => Math.random() > 0.2);
    await Promise.all(
      presentIds.map((empId) =>
        prisma.attendance.create({
          data: { employeeId: empId, clockIn, clockOut, date },
        }).catch(() => {}) // ignore duplicates
      )
    );
  }

  // Create leave requests
  await Promise.all([
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[0].employee!.id,
        leaveType: LeaveType.ANNUAL,
        startDate: new Date("2025-07-01"),
        endDate: new Date("2025-07-05"),
        reason: "Family vacation",
        status: LeaveStatus.APPROVED,
        reviewerId: hrUser.id,
        reviewNote: "Approved. Enjoy your holiday!",
      },
    }),
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[1].employee!.id,
        leaveType: LeaveType.SICK,
        startDate: new Date("2025-06-20"),
        endDate: new Date("2025-06-21"),
        reason: "Not feeling well",
        status: LeaveStatus.APPROVED,
        reviewerId: hrUser.id,
      },
    }),
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[2].employee!.id,
        leaveType: LeaveType.PERSONAL,
        startDate: new Date("2025-08-10"),
        endDate: new Date("2025-08-10"),
        reason: "Personal matters to attend to",
        status: LeaveStatus.PENDING,
      },
    }),
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[3].employee!.id,
        leaveType: LeaveType.ANNUAL,
        startDate: new Date("2025-08-15"),
        endDate: new Date("2025-08-20"),
        reason: "Annual leave",
        status: LeaveStatus.PENDING,
      },
    }),
    prisma.leaveRequest.create({
      data: {
        employeeId: employees[4].employee!.id,
        leaveType: LeaveType.SICK,
        startDate: new Date("2025-05-30"),
        endDate: new Date("2025-05-31"),
        reason: "Medical appointment",
        status: LeaveStatus.REJECTED,
        reviewerId: hrUser.id,
        reviewNote: "Please resubmit with medical documentation.",
      },
    }),
  ]);

  // Create conversations and messages
  const emp0 = employees[0].employee!.id;
  const emp1 = employees[1].employee!.id;
  const hrEmp = hrUser.employee!.id;

  // Direct conversation
  const directConvo = await prisma.conversation.create({
    data: {
      type: ConversationType.DIRECT,
      participants: { create: [{ employeeId: emp0 }, { employeeId: emp1 }] },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: directConvo.id, senderId: emp0, content: "Hey Fatima, can you review my PR when you get a chance?", createdAt: new Date(Date.now() - 3600000) },
      { conversationId: directConvo.id, senderId: emp1, content: "Sure! I'll look at it this afternoon.", createdAt: new Date(Date.now() - 3000000) },
      { conversationId: directConvo.id, senderId: emp0, content: "Thanks, appreciate it!", createdAt: new Date(Date.now() - 2400000) },
    ],
  });

  // Employee to department
  const deptConvo = await prisma.conversation.create({
    data: {
      type: ConversationType.EMPLOYEE_TO_DEPT,
      participants: { create: [{ employeeId: hrEmp }, { departmentId: engineering.id }] },
    },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: deptConvo.id, senderId: hrEmp, content: "Hi Engineering team! Reminder that performance reviews are due by end of this month.", createdAt: new Date(Date.now() - 86400000) },
      { conversationId: deptConvo.id, senderId: emp0, content: "Noted, thank you for the reminder!", createdAt: new Date(Date.now() - 80000000) },
    ],
  });

  await prisma.conversation.updateMany({ data: { updatedAt: new Date() } });

  console.log("Seed complete.");
  console.log("  Admin:    admin@hrflow.com / admin123");
  console.log("  HR:       hr@hrflow.com / hr123");
  console.log("  Employee: emeka@hrflow.com / password123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
