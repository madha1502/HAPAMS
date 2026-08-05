const { prisma, addLog, getFloorByNumOrId } = require("../db.js");

/**
 * Format a Date object to YYYY-MM-DD string in local timezone
 */
function formatDate(d = new Date()) {
  return d.toISOString().split("T")[0];
}

/**
 * Format a Date object to HH:mm:ss string
 */
function formatTime(d = new Date()) {
  return d.toTimeString().split(" ")[0];
}

// GET /api/attendance
async function listAttendance(req, res) {
  try {
    const { date, floor, status, q } = req.query;
    const targetDate = date || formatDate();

    const where = { date: targetDate };

    if (status) {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { regNo: { contains: q, mode: "insensitive" } },
        { student: { name: { contains: q, mode: "insensitive" } } },
        { deviceId: { contains: q, mode: "insensitive" } }
      ];
    }

    let logs = await prisma.attendanceLog.findMany({
      where,
      include: {
        student: {
          include: { floor: true }
        }
      },
      orderBy: { timestamp: "desc" }
    });

    if (floor) {
      const floorRec = await getFloorByNumOrId(floor);
      if (floorRec) {
        logs = logs.filter(l => l.student && l.student.floorId === floorRec.id);
      }
    }

    const mapped = logs.map(l => ({
      id:          l.id,
      regNo:       l.regNo,
      studentName: l.student ? l.student.name : "Unknown",
      dept:        l.student ? l.student.dept : "N/A",
      year:        l.student ? l.student.year : 1,
      semester:    l.student ? l.student.semester : 1,
      floor:       l.student && l.student.floor ? (parseInt(l.student.floor.name.replace(/\D/g, ""), 10) || l.student.floor.id) : "-",
      room:        l.student ? l.student.room : "-",
      date:        l.date,
      time:        l.time,
      type:        l.type,
      status:      l.status,
      deviceId:    l.deviceId,
      biometricId: l.biometricId || "-",
      remarks:     l.remarks || ""
    }));

    res.json(mapped);
  } catch (error) {
    console.error("Error listing attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance logs." });
  }
}

// GET /api/attendance/summary
async function getAttendanceSummary(req, res) {
  try {
    const { date } = req.query;
    const targetDate = date || formatDate();

    const [allStudents, floors, logs] = await Promise.all([
      prisma.students.findMany({ include: { floor: true } }),
      prisma.floors.findMany({ orderBy: { name: "asc" } }),
      prisma.attendanceLog.findMany({
        where: { date: targetDate },
        include: { student: true }
      })
    ]);

    const totalStudents = allStudents.length;
    const presentRegNos = new Set(logs.filter(l => l.status === "PRESENT" || l.status === "LATE").map(l => l.regNo));
    const lateRegNos = new Set(logs.filter(l => l.status === "LATE").map(l => l.regNo));

    const totalPresent = presentRegNos.size;
    const totalLate = lateRegNos.size;

    const absentees = allStudents.filter(s => s.status === "Active" && !presentRegNos.has(s.regNo)).map(s => ({
      regNo: s.regNo,
      name: s.name,
      dept: s.dept,
      year: s.year,
      semester: s.semester,
      floor: s.floor ? (parseInt(s.floor.name.replace(/\D/g, ""), 10) || s.floor.id) : "-",
      room: s.room || "-"
    }));

    const totalAbsent = absentees.length;
    const attendanceRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

    // Floor-wise breakdown
    const floorSummary = floors.map(f => {
      const floorNum = parseInt(f.name.replace(/\D/g, ""), 10) || f.id;
      const floorStudents = allStudents.filter(s => s.floorId === f.id);
      const floorTotal = floorStudents.length;
      const floorPresent = floorStudents.filter(s => presentRegNos.has(s.regNo)).length;
      const floorRate = floorTotal > 0 ? Math.round((floorPresent / floorTotal) * 100) : 0;

      return {
        floorId: f.id,
        floorName: f.name,
        floorNum,
        total: floorTotal,
        present: floorPresent,
        absent: floorTotal - floorPresent,
        attendanceRate: floorRate
      };
    });

    res.json({
      date: targetDate,
      totalStudents,
      totalPresent,
      totalAbsent,
      totalLate,
      attendanceRate,
      absentees,
      floorSummary
    });
  } catch (error) {
    console.error("Error generating attendance summary:", error);
    res.status(500).json({ error: "Failed to generate attendance summary." });
  }
}

// POST /api/attendance/biometric-push (Hardware Integration API)
async function biometricPush(req, res) {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    if (payload.length === 0) {
      return res.status(400).json({ error: "Empty biometric payload." });
    }

    const createdLogs = [];
    const todayStr = formatDate();
    const nowTimeStr = formatTime();

    for (const item of payload) {
      const regNo = String(item.regNo || item.studentId || item.userId || "").trim().toUpperCase();
      if (!regNo) continue;

      const student = await prisma.students.findUnique({ where: { regNo } });

      const logTime = item.time || nowTimeStr;
      const logDate = item.date || todayStr;
      const logType = (item.type || "IN").toUpperCase();

      // Determine late status if entry is after 08:00:00
      let status = item.status || "PRESENT";
      if (logType === "IN" && !item.status) {
        const hour = parseInt(logTime.split(":")[0], 10);
        if (hour >= 8) {
          status = "LATE";
        }
      }

      const newLog = await prisma.attendanceLog.create({
        data: {
          studentId:   student ? student.id : null,
          regNo:       regNo,
          date:        logDate,
          time:        logTime,
          type:        logType,
          status:      status,
          deviceId:    item.deviceId || "BIO-HARDWARE-01",
          biometricId: item.biometricId || `BIO-${regNo}`,
          remarks:     item.remarks || "Biometric Hardware Automatic Sync"
        }
      });
      createdLogs.push(newLog);
    }

    addLog("biometric@hardware.api", `Ingested ${createdLogs.length} biometric scans`);
    res.status(201).json({
      success: true,
      message: `Successfully recorded ${createdLogs.length} biometric scan(s).`,
      count: createdLogs.length
    });
  } catch (error) {
    console.error("Error in biometricPush:", error);
    res.status(500).json({ error: "Failed to ingest biometric data." });
  }
}

// POST /api/attendance/simulate (Interactive UI Scanner Test)
async function simulatePunch(req, res) {
  try {
    const { regNo, type = "IN", deviceId = "BIO-FL1-MAIN" } = req.body;
    if (!regNo) return res.status(400).json({ error: "Register number is required." });

    const student = await prisma.students.findUnique({
      where: { regNo: regNo.toUpperCase() },
      include: { floor: true }
    });

    if (!student) {
      return res.status(404).json({ error: `Student with Reg No '${regNo}' not found.` });
    }

    const todayStr = formatDate();
    const nowTimeStr = formatTime();
    const hour = new Date().getHours();
    const status = (type === "IN" && hour >= 8) ? "LATE" : "PRESENT";

    const log = await prisma.attendanceLog.create({
      data: {
        studentId:   student.id,
        regNo:       student.regNo,
        date:        todayStr,
        time:        nowTimeStr,
        type:        type,
        status:      status,
        deviceId:    deviceId,
        biometricId: `BIO-${student.regNo}`,
        remarks:     `Simulated Biometric Punch (${type})`
      },
      include: {
        student: { include: { floor: true } }
      }
    });

    addLog("admin@hostel.edu", `Simulated Biometric ${type} punch for ${student.regNo}`);
    res.status(201).json({
      id:          log.id,
      regNo:       log.regNo,
      studentName: student.name,
      dept:        student.dept,
      floor:       student.floor ? (parseInt(student.floor.name.replace(/\D/g, ""), 10) || student.floor.id) : "-",
      room:        student.room,
      date:        log.date,
      time:        log.time,
      type:        log.type,
      status:      log.status,
      deviceId:    log.deviceId,
      remarks:     log.remarks
    });
  } catch (error) {
    console.error("Error in simulatePunch:", error);
    res.status(500).json({ error: "Failed to simulate biometric punch." });
  }
}

module.exports = {
  listAttendance,
  getAttendanceSummary,
  biometricPush,
  simulatePunch
};
