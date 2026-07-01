const { prisma, addLog } = require("../db.js");
const { v4: uuidv4 } = require("uuid");

// ─── AUTH ────────────────────────────────────────────────────────────────────
async function login(req, res) {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Attempt to locate user in PostgreSQL
    const user = await prisma.users.findUnique({ where: { email } });
    
    // Demo mode fallback: if user doesn't exist, allow sign-in and act as Warden
    const matchedUser = user || { email, role: role || "Warden", name: email };

    if (user) {
      // Update last login timestamp in db
      await prisma.users.update({
        where: { id: user.id },
        data: {
          lastLogin: new Date().toISOString().slice(0, 16).replace("T", " ")
        }
      });
    }

    addLog(email, "User Logged In");
    res.json({
      token: "demo-jwt-token",
      user: {
        email: matchedUser.email,
        name:  matchedUser.name,
        role:  matchedUser.role || role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Authentication failed." });
  }
}

// ─── USERS ───────────────────────────────────────────────────────────────────
async function listUsers(req, res) {
  try {
    const users = await prisma.users.findMany({
      orderBy: { email: "asc" }
    });
    res.json(users);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, role } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "name and email are required." });
    }

    const duplicate = await prisma.users.findUnique({ where: { email } });
    if (duplicate) {
      return res.status(409).json({ error: "Email already exists." });
    }

    const user = await prisma.users.create({
      data: {
        name,
        email,
        role:         role || "Warden",
        status:       "Active",
        passwordHash: "Default@123", // Placeholder for actual password hashing in production
        lastLogin:    "—"
      }
    });

    addLog("admin@hostel.edu", `Created user ${email}`);
    res.status(201).json(user);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Failed to create user." });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ error: "User not found." });

    await prisma.users.delete({ where: { id } });

    addLog("admin@hostel.edu", `Deleted user ${user.email}`);
    res.json({ message: `User ${user.email} deleted.` });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────
async function listReports(req, res) {
  try {
    const reports = await prisma.reports.findMany({
      orderBy: { date: "desc" }
    });

    // Map DB fields to what the frontend JSON contract expects
    const response = reports.map(r => ({
      id:      r.id,
      title:   r.title,
      year:    r.academicYear,
      sem:     r.semester,
      by:      r.generatedBy,
      date:    r.date,
      floors:  r.floors,
      summary: r.summaryJson,
      college: r.college,
      hostel:  r.hostel
    }));

    res.json(response);
  } catch (error) {
    console.error("List reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
}

async function createReport(req, res) {
  try {
    const { title, year, sem, by, summary, college, hostel } = req.body;

    const floorsCount = await prisma.floors.count();
    const sysSettings = await prisma.settings.findUnique({ where: { id: "default" } }) || {
      college:  "ABC Engineering College",
      hostel:   "Men's Hostel Block A",
      year:     "2024-25",
      semester: "1"
    };

    const newReport = await prisma.reports.create({
      data: {
        title:        title || `Semester ${sem || sysSettings.semester} - ${year || sysSettings.year} Report`,
        academicYear: year || sysSettings.year,
        semester:     sem || sysSettings.semester,
        generatedBy:  by || "Admin",
        date:         new Date().toISOString().slice(0, 10),
        floors:       floorsCount,
        summaryJson:  summary || [],
        college:      college || sysSettings.college,
        hostel:       hostel || sysSettings.hostel
      }
    });

    addLog(req.body.user || "admin@hostel.edu", `Generated report: ${newReport.title}`);

    res.status(201).json({
      id:      newReport.id,
      title:   newReport.title,
      year:    newReport.academicYear,
      sem:     newReport.semester,
      by:      newReport.generatedBy,
      date:    newReport.date,
      floors:  newReport.floors,
      summary: newReport.summaryJson,
      college: newReport.college,
      hostel:  newReport.hostel
    });
  } catch (error) {
    console.error("Create report error:", error);
    res.status(500).json({ error: "Failed to save report." });
  }
}

async function deleteReport(req, res) {
  try {
    const { id } = req.params;
    const report = await prisma.reports.findUnique({ where: { id } });
    if (!report) return res.status(404).json({ error: "Report not found." });

    await prisma.reports.delete({ where: { id } });
    res.json({ message: `Report "${report.title}" deleted.` });
  } catch (error) {
    console.error("Delete report error:", error);
    res.status(500).json({ error: "Failed to delete report." });
  }
}

// ─── LOGS ────────────────────────────────────────────────────────────────────
async function listLogs(req, res) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" }
    });

    const mapped = logs.map(l => ({
      id:     l.id,
      user:   l.userEmail,
      action: l.action,
      date:   l.createdAt.toISOString().slice(0, 10),
      time:   l.createdAt.toTimeString().slice(0, 8),
    }));

    res.json(mapped);
  } catch (error) {
    console.error("List logs error:", error);
    res.status(500).json({ error: "Failed to fetch logs." });
  }
}

// ─── SETTINGS ────────────────────────────────────────────────────────────────
async function getSettings(req, res) {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id:       "default",
          college:  "ABC Engineering College",
          hostel:   "Men's Hostel Block A",
          year:     "2024-25",
          semester: "1"
        }
      });
    }

    res.json({
      college: settings.college,
      hostel:  settings.hostel,
      year:    settings.year,
      sem:     settings.semester,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
}

async function updateSettings(req, res) {
  try {
    const { college, hostel, year, sem } = req.body;

    const updated = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        college:  college,
        hostel:   hostel,
        year:     year,
        semester: sem,
      },
      create: {
        id:       "default",
        college:  college || "ABC Engineering College",
        hostel:   hostel || "Men's Hostel Block A",
        year:     year || "2024-25",
        semester: sem || "1"
      }
    });

    addLog("admin@hostel.edu", "Updated system settings");

    res.json({
      college: updated.college,
      hostel:  updated.hostel,
      year:    updated.year,
      sem:     updated.semester,
    });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings." });
  }
}

// ─── DASHBOARD STATS ─────────────────────────────────────────────────────────
async function getDashboard(req, res) {
  try {
    const totalStudents = await prisma.students.count();
    const activeStudents = await prisma.students.count({ where: { status: "Active" } });
    const totalFloors = await prisma.floors.count();
    const totalRooms = await prisma.rooms.count();
    const vacantRooms = await prisma.rooms.count({ where: { status: "Vacant" } });

    // Aggregate department student counts
    const deptGroups = await prisma.students.groupBy({
      by: ["dept"],
      _count: {
        _all: true
      }
    });
    const deptCounts = {};
    deptGroups.forEach(g => {
      deptCounts[g.dept] = g._count._all;
    });

    // Aggregate floor student counts
    const floorGroups = await prisma.students.groupBy({
      by: ["floorId"],
      _count: {
        _all: true
      }
    });

    const floors = await prisma.floors.findMany();
    const floorMap = {};
    floors.forEach(f => {
      floorMap[f.id] = f.name;
    });

    const floorCounts = {};
    floorGroups.forEach(g => {
      const floorName = floorMap[g.floorId] || `Floor ${g.floorId}`;
      floorCounts[floorName] = g._count._all;
    });

    res.json({
      totalStudents,
      activeStudents,
      totalFloors,
      totalRooms,
      vacantRooms,
      deptCounts,
      floorCounts,
    });
  } catch (error) {
    console.error("Get dashboard error:", error);
    res.status(500).json({ error: "Failed to compute dashboard stats." });
  }
}

// ─── RESULT ANALYSIS ─────────────────────────────────────────────────────────
function getFloorNumFromName(floorName) {
  if (!floorName || floorName.toLowerCase() === "overall") return null;
  const lower = floorName.toLowerCase();
  if (lower.includes("ground")) return 1;
  if (lower.includes("first")) return 2;
  if (lower.includes("second")) return 3;
  if (lower.includes("third")) return 4;
  if (lower.includes("fourth")) return 5;
  if (lower.includes("fifth")) return 6;
  
  const match = lower.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function aggregateReportOverall(report) {
  let total = 0;
  let appeared = 0;
  let passed = 0;
  let failed = 0;
  
  const subjectMap = {};
  const deptMap = {};
  let totalGpaSum = 0;
  let gpaCount = 0;
  let bestCgpa = -1;
  let overallTopper = "-";

  report.summary.forEach(fs => {
    total += fs.total || 0;
    appeared += fs.appeared || 0;
    passed += fs.passed || 0;
    failed += fs.failed || 0;

    if (fs.avg && fs.avg !== "-") {
      totalGpaSum += parseFloat(fs.avg) * (fs.appeared || 1);
      gpaCount += (fs.appeared || 1);
    }

    if (fs.topper && fs.topper !== "-") {
      const match = fs.topper.match(/\(([^)]+)\)/);
      if (match) {
        const cgpa = parseFloat(match[1]);
        if (cgpa > bestCgpa) {
          bestCgpa = cgpa;
          overallTopper = fs.topper;
        }
      } else if (overallTopper === "-") {
        overallTopper = fs.topper;
      }
    }

    if (fs.subjects) {
      fs.subjects.forEach(sub => {
        if (!subjectMap[sub.code]) {
          subjectMap[sub.code] = { code: sub.code, name: sub.name || sub.code, total: 0, passed: 0, failed: 0 };
        }
        subjectMap[sub.code].total += sub.total || 0;
        subjectMap[sub.code].passed += sub.passed || 0;
        subjectMap[sub.code].failed += sub.failed || 0;
      });
    }

    if (fs.departments) {
      fs.departments.forEach(dept => {
        if (!deptMap[dept.name]) {
          deptMap[dept.name] = { name: dept.name, total: 0, passed: 0, failed: 0 };
        }
        deptMap[dept.name].total += dept.total || 0;
        deptMap[dept.name].passed += dept.passed || 0;
        deptMap[dept.name].failed += dept.failed || 0;
      });
    }
  });

  const subjects = Object.values(subjectMap).map(sub => ({
    ...sub,
    passPercent: sub.total > 0 ? Math.round((sub.passed / sub.total) * 100) : 0
  }));

  const departments = Object.values(deptMap).map(dept => ({
    ...dept,
    passPercent: dept.total > 0 ? Math.round((dept.passed / dept.total) * 100) : 0
  }));

  const avgGpa = gpaCount > 0 ? (totalGpaSum / gpaCount).toFixed(2) : "-";
  const passPercent = total > 0 ? Math.round((passed / total) * 100) : 0;

  let studentsList = [];
  report.summary.forEach(fs => {
    if (fs.studentsList) {
      studentsList = studentsList.concat(fs.studentsList);
    }
  });

  return {
    title:            report.title,
    year:             report.year,
    sem:              report.sem,
    by:               report.by,
    date:             report.date,
    floorName:        "Overall",
    floorNum:         null,
    totalStudents:    total,
    appearedStudents: appeared,
    absentStudents:   total - appeared,
    passedStudents:   passed,
    failedStudents:   failed,
    passPercent,
    failPercent:      100 - passPercent,
    topper:           overallTopper,
    avg:              avgGpa,
    subjects,
    departments,
    studentsList
  };
}

async function getResultAnalysis(req, res) {
  try {
    const { floor } = req.query;

    const reports = await prisma.reports.findMany({
      orderBy: { date: "desc" },
      take: 1
    });
    
    const latestReport = reports[0];
    if (!latestReport) {
      return res.json({ error: "No result analysis reports found. Please upload a report first." });
    }

    // Format DB report to match helper's expected in-memory format
    const formattedReport = {
      id:      latestReport.id,
      title:   latestReport.title,
      year:    latestReport.academicYear,
      sem:     latestReport.semester,
      by:      latestReport.generatedBy,
      date:    latestReport.date,
      floors:  latestReport.floors,
      summary: latestReport.summaryJson,
      college: latestReport.college,
      hostel:  latestReport.hostel
    };

    const floorNum = getFloorNumFromName(floor);

    if (!floorNum) {
      const overall = aggregateReportOverall(formattedReport);
      return res.json(overall);
    } else {
      const floorSummary = formattedReport.summary.find(f => Number(f.floor) === floorNum);
      if (!floorSummary) {
        return res.json({
          title:            formattedReport.title,
          year:             formattedReport.year,
          sem:              formattedReport.sem,
          by:               formattedReport.by,
          date:             formattedReport.date,
          floorName:        floor,
          floorNum:         floorNum,
          totalStudents:    0,
          appearedStudents: 0,
          absentStudents:   0,
          passedStudents:   0,
          failedStudents:   0,
          passPercent:      0,
          failPercent:      0,
          topper:           "-",
          avg:              "-",
          subjects:         [],
          departments:      [],
          studentsList:     []
        });
      }
      return res.json({
        title:            formattedReport.title,
        year:             formattedReport.year,
        sem:              formattedReport.sem,
        by:               formattedReport.by,
        date:             formattedReport.date,
        floorName:        floor,
        floorNum:         floorNum,
        totalStudents:    floorSummary.total || 0,
        appearedStudents: floorSummary.appeared || 0,
        absentStudents:   (floorSummary.total || 0) - (floorSummary.appeared || 0),
        passedStudents:   floorSummary.passed || 0,
        failedStudents:   floorSummary.failed || 0,
        passPercent:      floorSummary.passPercent || 0,
        failPercent:      100 - (floorSummary.passPercent || 0),
        topper:           floorSummary.topper || "-",
        avg:              floorSummary.avg || "-",
        subjects:         floorSummary.subjects || [],
        departments:      floorSummary.departments || [],
        studentsList:     floorSummary.studentsList || []
      });
    }
  } catch (error) {
    console.error("Result analysis error:", error);
    res.status(500).json({ error: "Failed to run result analysis." });
  }
}

module.exports = {
  login,
  listUsers,
  createUser,
  deleteUser,
  listReports,
  createReport,
  deleteReport,
  listLogs,
  getSettings,
  updateSettings,
  getDashboard,
  getResultAnalysis,
};
