const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Clear existing data in reverse order of dependencies
  await prisma.activityLog.deleteMany({});
  await prisma.examResults.deleteMany({});
  await prisma.reports.deleteMany({});
  await prisma.students.deleteMany({});
  await prisma.rooms.deleteMany({});
  await prisma.floors.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.settings.deleteMany({});

  console.log("🧹 Cleaned existing tables.");

  // 2. Settings
  const settings = await prisma.settings.create({
    data: {
      id: "default",
      college: "ABC Engineering College",
      hostel: "Men's Hostel Block A",
      year: "2024-25",
      semester: "1"
    }
  });
  console.log("✅ Seeded Settings.");

  // 3. Users
  const userAdmin = await prisma.users.create({
    data: {
      id: "u1",
      name: "Super Admin",
      email: "admin@hostel.edu",
      passwordHash: "Admin@123", // Swap for real hash in prod
      role: "Super Admin",
      status: "Active",
      lastLogin: "2025-01-10 14:00"
    }
  });

  const userWarden1 = await prisma.users.create({
    data: {
      id: "u2",
      name: "John Warden",
      email: "warden@hostel.edu",
      passwordHash: "Warden@123",
      role: "Warden",
      status: "Active",
      lastLogin: "2025-01-09 09:00"
    }
  });

  const userWarden2 = await prisma.users.create({
    data: {
      id: "u3",
      name: "Mary Warden",
      email: "mary@hostel.edu",
      passwordHash: "Mary@123",
      role: "Warden",
      status: "Inactive",
      lastLogin: "2024-12-20 11:00"
    }
  });
  console.log("✅ Seeded Users.");

  // 4. Floors
  const floor1 = await prisma.floors.create({
    data: { id: "f1", name: "Floor 1", capacity: 40, hostel: "Men's Hostel", description: "", status: "Active" }
  });
  const floor2 = await prisma.floors.create({
    data: { id: "f2", name: "Floor 2", capacity: 40, hostel: "Men's Hostel", description: "", status: "Active" }
  });
  const floor3 = await prisma.floors.create({
    data: { id: "f3", name: "Floor 3", capacity: 30, hostel: "Men's Hostel", description: "", status: "Active" }
  });
  const floor4 = await prisma.floors.create({
    data: { id: "f4", name: "Floor 4", capacity: 30, hostel: "Men's Hostel", description: "", status: "Active" }
  });
  console.log("✅ Seeded Floors.");

  // 5. Rooms
  const roomsData = [
    { id: "101", floorId: "f1", capacity: 3, status: "Occupied" },
    { id: "102", floorId: "f1", capacity: 3, status: "Occupied" },
    { id: "103", floorId: "f1", capacity: 3, status: "Occupied" },
    { id: "104", floorId: "f1", capacity: 3, status: "Vacant" },
    { id: "201", floorId: "f2", capacity: 3, status: "Occupied" },
    { id: "202", floorId: "f2", capacity: 3, status: "Occupied" },
    { id: "203", floorId: "f2", capacity: 3, status: "Vacant" },
    { id: "301", floorId: "f3", capacity: 2, status: "Full" },
    { id: "302", floorId: "f3", capacity: 2, status: "Vacant" },
    { id: "401", floorId: "f4", capacity: 2, status: "Full" },
    { id: "402", floorId: "f4", capacity: 2, status: "Occupied" }
  ];

  for (const r of roomsData) {
    await prisma.rooms.create({
      data: {
        id: r.id,
        roomNumber: r.id,
        floorId: r.floorId,
        capacity: r.capacity,
        status: r.status
      }
    });
  }
  console.log("✅ Seeded Rooms.");

  // 6. Students
  const studentsData = [
    { regNo: "22CS001", name: "Arjun Kumar",  dept: "CSE",   year: 2, section: "A", hostel: "Men's Hostel", floorId: "f1", room: "101", status: "Active" },
    { regNo: "22CS002", name: "Priya Sharma",  dept: "CSE",   year: 2, section: "A", hostel: "Men's Hostel", floorId: "f1", room: "102", status: "Active" },
    { regNo: "22ME001", name: "Vikram Reddy",  dept: "MECH",  year: 3, section: "B", hostel: "Men's Hostel", floorId: "f2", room: "201", status: "Active" },
    { regNo: "22ME002", name: "Sanjay Patel",  dept: "MECH",  year: 3, section: "B", hostel: "Men's Hostel", floorId: "f2", room: "202", status: "Active" },
    { regNo: "22EC001", name: "Anitha Devi",   dept: "ECE",   year: 2, section: "C", hostel: "Men's Hostel", floorId: "f3", room: "301", status: "Active" },
    { regNo: "22EC002", name: "Ravi Shankar",  dept: "ECE",   year: 2, section: "C", hostel: "Men's Hostel", floorId: "f3", room: "302", status: "Active" },
    { regNo: "21CS001", name: "Deepika Nair",  dept: "CSE",   year: 3, section: "A", hostel: "Men's Hostel", floorId: "f1", room: "103", status: "Active" },
    { regNo: "21ME001", name: "Karthik Raj",   dept: "MECH",  year: 4, section: "A", hostel: "Men's Hostel", floorId: "f2", room: "203", status: "Inactive" },
    { regNo: "22CE001", name: "Suresh Babu",   dept: "CIVIL", year: 2, section: "A", hostel: "Men's Hostel", floorId: "f4", room: "401", status: "Active" },
    { regNo: "22CE002", name: "Mohan Das",     dept: "CIVIL", year: 2, section: "A", hostel: "Men's Hostel", floorId: "f4", room: "402", status: "Active" }
  ];

  for (const s of studentsData) {
    await prisma.students.create({
      data: {
        regNo: s.regNo,
        name: s.name,
        dept: s.dept,
        year: s.year,
        section: s.section,
        hostel: s.hostel,
        floorId: s.floorId,
        room: s.room,
        status: s.status
      }
    });
  }
  console.log("✅ Seeded Students.");

  // 7. Reports
  const report1 = await prisma.reports.create({
    data: {
      id: "r1",
      title: "Semester 1 - 2024-25 Overall Report",
      academicYear: "2024-25",
      semester: "1",
      generatedBy: "Admin",
      date: "2025-01-10",
      floors: 4,
      college: "ABC Engineering College",
      hostel: "Men's Hostel Block A",
      summaryJson: [
        {
          floor: 1, total: 20, appeared: 20, passed: 18, failed: 2, passPercent: 90, topper: "Arjun Kumar (9.25)", avg: "8.12",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 20, passed: 19, failed: 1, passPercent: 95 },
            { code: "CS3301", name: "Data Structures", total: 20, passed: 18, failed: 2, passPercent: 90 },
            { code: "CS3391", name: "Object Oriented Programming", total: 20, passed: 20, failed: 0, passPercent: 100 }
          ],
          departments: [
            { name: "CSE", total: 12, passed: 11, failed: 1, passPercent: 92 },
            { name: "ECE", total: 4, passed: 4, failed: 0, passPercent: 100 },
            { name: "MECH", total: 4, passed: 3, failed: 1, passPercent: 75 }
          ],
          studentsList: [
            { regNo: "22CS001", name: "Arjun Kumar", dept: "CSE", gpa: 9.15, cgpa: 9.25, hasFail: false, reappear: 0 },
            { regNo: "22CS002", name: "Priya Sharma", dept: "CSE", gpa: 8.45, cgpa: 8.55, hasFail: false, reappear: 0 },
            { regNo: "21CS001", name: "Deepika Nair", dept: "CSE", gpa: 8.90, cgpa: 9.10, hasFail: false, reappear: 0 },
            { regNo: "22CS003", name: "Amit Patel", dept: "CSE", gpa: 5.40, cgpa: 5.60, hasFail: true, reappear: 1 }
          ]
        },
        {
          floor: 2, total: 15, appeared: 15, passed: 12, failed: 3, passPercent: 80, topper: "Sanjay Patel (8.80)", avg: "7.45",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 15, passed: 12, failed: 3, passPercent: 80 },
            { code: "CS3301", name: "Data Structures", total: 15, passed: 13, failed: 2, passPercent: 87 },
            { code: "CS3391", name: "Object Oriented Programming", total: 15, passed: 14, failed: 1, passPercent: 93 }
          ],
          departments: [
            { name: "CSE", total: 8, passed: 6, failed: 2, passPercent: 75 },
            { name: "ECE", total: 4, passed: 3, failed: 1, passPercent: 75 },
            { name: "MECH", total: 3, passed: 3, failed: 0, passPercent: 100 }
          ],
          studentsList: [
            { regNo: "22ME001", name: "Vikram Reddy", dept: "MECH", gpa: 8.10, cgpa: 8.30, hasFail: false, reappear: 0 },
            { regNo: "22ME002", name: "Sanjay Patel", dept: "MECH", gpa: 8.70, cgpa: 8.80, hasFail: false, reappear: 0 },
            { regNo: "22ME003", name: "Rajesh K", dept: "MECH", gpa: 5.10, cgpa: 5.50, hasFail: true, reappear: 2 }
          ]
        },
        {
          floor: 3, total: 18, appeared: 18, passed: 17, failed: 1, passPercent: 94, topper: "Anitha Devi (9.50)", avg: "8.56",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 18, passed: 17, failed: 1, passPercent: 94 },
            { code: "CS3301", name: "Data Structures", total: 18, passed: 17, failed: 1, passPercent: 94 },
            { code: "CS3391", name: "Object Oriented Programming", total: 18, passed: 18, failed: 0, passPercent: 100 }
          ],
          departments: [
            { name: "CSE", total: 10, passed: 9, failed: 1, passPercent: 90 },
            { name: "ECE", total: 5, passed: 5, failed: 0, passPercent: 100 },
            { name: "MECH", total: 3, passed: 3, failed: 0, passPercent: 100 }
          ],
          studentsList: [
            { regNo: "22EC001", name: "Anitha Devi", dept: "ECE", gpa: 9.40, cgpa: 9.50, hasFail: false, reappear: 0 },
            { regNo: "22EC002", name: "Ravi Shankar", dept: "ECE", gpa: 9.10, cgpa: 9.20, hasFail: false, reappear: 0 }
          ]
        },
        {
          floor: 4, total: 12, appeared: 12, passed: 10, failed: 2, passPercent: 83, topper: "Suresh Babu (8.90)", avg: "7.88",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 12, passed: 10, failed: 2, passPercent: 83 },
            { code: "CS3301", name: "Data Structures", total: 12, passed: 11, failed: 1, passPercent: 92 },
            { code: "CS3391", name: "Object Oriented Programming", total: 12, passed: 11, failed: 1, passPercent: 92 }
          ],
          departments: [
            { name: "CSE", total: 6, passed: 5, failed: 1, passPercent: 83 },
            { name: "ECE", total: 4, passed: 3, failed: 1, passPercent: 75 },
            { name: "MECH", total: 2, passed: 2, failed: 0, passPercent: 100 }
          ],
          studentsList: [
            { regNo: "22CE001", name: "Suresh Babu", dept: "CIVIL", gpa: 8.70, cgpa: 8.90, hasFail: false, reappear: 0 },
            { regNo: "22CE002", name: "Mohan Das", dept: "CIVIL", gpa: 8.50, cgpa: 8.70, hasFail: false, reappear: 0 }
          ]
        }
      ]
    }
  });

  const report2 = await prisma.reports.create({
    data: {
      id: "r2",
      title: "Semester 2 - 2023-24 Floor Report",
      academicYear: "2023-24",
      semester: "2",
      generatedBy: "Warden",
      date: "2024-06-15",
      floors: 4,
      college: "ABC Engineering College",
      hostel: "Men's Hostel Block A",
      summaryJson: [
        {
          floor: 1, total: 18, appeared: 18, passed: 15, failed: 3, passPercent: 83, topper: "Deepika Nair (9.10)", avg: "7.95",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 18, passed: 16, failed: 2, passPercent: 89 },
            { code: "CS3301", name: "Data Structures", total: 18, passed: 15, failed: 3, passPercent: 83 }
          ],
          departments: [
            { name: "CSE", total: 18, passed: 15, failed: 3, passPercent: 83 }
          ],
          studentsList: [
            { regNo: "21CS001", name: "Deepika Nair", dept: "CSE", gpa: 9.00, cgpa: 9.10, hasFail: false, reappear: 0 }
          ]
        },
        {
          floor: 2, total: 14, appeared: 14, passed: 13, failed: 1, passPercent: 93, topper: "Vikram Reddy (9.30)", avg: "8.40",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 14, passed: 13, failed: 1, passPercent: 93 },
            { code: "CS3301", name: "Data Structures", total: 14, passed: 14, failed: 0, passPercent: 100 }
          ],
          departments: [
            { name: "MECH", total: 14, passed: 13, failed: 1, passPercent: 93 }
          ],
          studentsList: [
            { regNo: "22ME001", name: "Vikram Reddy", dept: "MECH", gpa: 9.20, cgpa: 9.30, hasFail: false, reappear: 0 }
          ]
        },
        {
          floor: 3, total: 15, appeared: 15, passed: 14, failed: 1, passPercent: 93, topper: "Ravi Shankar (9.20)", avg: "8.32",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 15, passed: 14, failed: 1, passPercent: 93 },
            { code: "CS3301", name: "Data Structures", total: 15, passed: 15, failed: 0, passPercent: 100 }
          ],
          departments: [
            { name: "ECE", total: 15, passed: 14, failed: 1, passPercent: 93 }
          ],
          studentsList: [
            { regNo: "22EC002", name: "Ravi Shankar", dept: "ECE", gpa: 9.10, cgpa: 9.20, hasFail: false, reappear: 0 }
          ]
        },
        {
          floor: 4, total: 10, appeared: 10, passed: 8, failed: 2, passPercent: 80, topper: "Mohan Das (8.70)", avg: "7.60",
          subjects: [
            { code: "CS3351", name: "Digital Principles", total: 10, passed: 8, failed: 2, passPercent: 80 },
            { code: "CS3301", name: "Data Structures", total: 10, passed: 9, failed: 1, passPercent: 90 }
          ],
          departments: [
            { name: "CIVIL", total: 10, passed: 8, failed: 2, passPercent: 80 }
          ],
          studentsList: [
            { regNo: "22CE002", name: "Mohan Das", dept: "CIVIL", gpa: 8.40, cgpa: 8.70, hasFail: false, reappear: 0 }
          ]
        }
      ]
    }
  });
  console.log("✅ Seeded Reports.");

  // 8. ActivityLog
  const logsData = [
    { userId: "u1", userEmail: "admin@hostel.edu",  action: "Generated Semester 1 Report",           createdAt: new Date("2025-01-10T14:32:08Z") },
    { userId: "u2", userEmail: "warden@hostel.edu", action: "Uploaded Result Excel",                  createdAt: new Date("2025-01-10T14:15:22Z") },
    { userId: "u1", userEmail: "admin@hostel.edu",  action: "Reset Password for warden@hostel.edu",   createdAt: new Date("2025-01-09T11:02:45Z") },
    { userId: "u2", userEmail: "warden@hostel.edu", action: "User Logged In",                         createdAt: new Date("2025-01-09T09:00:11Z") },
    { userId: "u1", userEmail: "admin@hostel.edu",  action: "Imported 120 students from Excel",        createdAt: new Date("2025-01-08T10:45:00Z") },
    { userId: "u1", userEmail: "admin@hostel.edu",  action: "User Logged In",                         createdAt: new Date("2025-01-08T09:30:00Z") }
  ];

  for (const l of logsData) {
    await prisma.activityLog.create({
      data: {
        userId: l.userId,
        userEmail: l.userEmail,
        action: l.action,
        createdAt: l.createdAt
      }
    });
  }
  console.log("✅ Seeded ActivityLogs.");
  console.log("🌱 Database seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error while seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
