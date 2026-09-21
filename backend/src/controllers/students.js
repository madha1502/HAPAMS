const { prisma, addLog, getFloorByNumOrId, fallbackStore } = require("../db.js");

// Helper to map student record to frontend JSON contract
function mapStudent(s) {
  return {
    id:       s.id,
    regNo:    s.regNo,
    name:     s.name,
    dept:     s.dept,
    year:     s.year,
    semester: s.semester || 1,
    section:  s.section || "",
    hostel:   s.hostel,
    floor:    s.floor ? (typeof s.floor === "object" ? (parseInt(s.floor.name.replace(/\D/g, ""), 10) || s.floor.id) : s.floor) : 1,
    room:     s.room || "",
    status:   s.status,
  };
}

// GET /api/students
async function listStudents(req, res) {
  try {
    const { dept, floor, status, q } = req.query;
    const where = {};

    if (dept) where.dept = dept;
    if (floor) {
      const floorRec = await getFloorByNumOrId(floor);
      if (floorRec) {
        where.floorId = floorRec.id;
      } else {
        return res.json([]);
      }
    }
    if (status) where.status = status;
    
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { regNo: { contains: q, mode: "insensitive" } },
        { dept: { contains: q, mode: "insensitive" } },
        { room: { contains: q, mode: "insensitive" } },
      ];
    }

    const students = await prisma.students.findMany({
      where,
      include: { floor: true },
      orderBy: { regNo: "asc" }
    });

    res.json(students.map(mapStudent));
  } catch (error) {
    console.warn("⚠️ Database error listing students, returning fallback store:", error.message);
    let list = fallbackStore.students;
    if (req.query.dept) list = list.filter(s => s.dept === req.query.dept);
    if (req.query.status) list = list.filter(s => s.status === req.query.status);
    res.json(list);
  }
}

// GET /api/students/:regNo
async function getStudent(req, res) {
  try {
    const { regNo } = req.params;
    const student = await prisma.students.findUnique({
      where: { regNo },
      include: { floor: true }
    });
    if (!student) return res.status(404).json({ error: "Student not found." });
    res.json(mapStudent(student));
  } catch (error) {
    console.error("Error fetching student:", error);
    res.status(500).json({ error: "Failed to fetch student." });
  }
}

// POST /api/students
async function createStudent(req, res) {
  try {
    const { regNo, name, dept, year, semester, section, hostel, floor, room, status } = req.body;
    if (!regNo || !name || !dept) {
      return res.status(400).json({ error: "regNo, name, and dept are required." });
    }

    const duplicate = await prisma.students.findUnique({
      where: { regNo }
    });
    if (duplicate) {
      return res.status(409).json({ error: "Register number already exists." });
    }

    const floorRec = await getFloorByNumOrId(floor);
    if (!floorRec) {
      return res.status(400).json({ error: "Invalid floor specified." });
    }

    const newStudent = await prisma.students.create({
      data: {
        regNo,
        name,
        dept,
        year:       Number(year) || 1,
        semester:   Number(semester) || 1,
        section:    section || "",
        hostel:     hostel || "Men's Hostel",
        floorId:    floorRec.id,
        room:       room || "",
        status:     status || "Active"
      },
      include: { floor: true }
    });

    addLog("admin@hostel.edu", `Added student ${regNo} – ${name}`);
    res.status(201).json(mapStudent(newStudent));
  } catch (error) {
    console.error("Error creating student:", error);
    res.status(500).json({ error: "Failed to create student." });
  }
}

// PUT /api/students/:regNo
async function updateStudent(req, res) {
  try {
    const { regNo } = req.params;
    const student = await prisma.students.findUnique({
      where: { regNo }
    });
    if (!student) return res.status(404).json({ error: "Student not found." });

    const updateData = {};
    const { name, dept, year, semester, section, hostel, floor, room, status } = req.body;

    if (name !== undefined) updateData.name = name;
    if (dept !== undefined) updateData.dept = dept;
    if (year !== undefined) updateData.year = Number(year);
    if (semester !== undefined) updateData.semester = Number(semester);
    if (section !== undefined) updateData.section = section;
    if (hostel !== undefined) updateData.hostel = hostel;
    if (room !== undefined) updateData.room = room;
    if (status !== undefined) updateData.status = status;

    if (floor !== undefined) {
      const floorRec = await getFloorByNumOrId(floor);
      if (!floorRec) {
        return res.status(400).json({ error: "Invalid floor specified." });
      }
      updateData.floorId = floorRec.id;
    }

    const updated = await prisma.students.update({
      where: { regNo },
      data: updateData,
      include: { floor: true }
    });

    addLog("admin@hostel.edu", `Updated student ${updated.regNo}`);
    res.json(mapStudent(updated));
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).json({ error: "Failed to update student." });
  }
}

// DELETE /api/students/:regNo
async function deleteStudent(req, res) {
  try {
    const { regNo } = req.params;
    const student = await prisma.students.findUnique({ where: { regNo } });
    if (!student) return res.status(404).json({ error: "Student not found." });

    await prisma.students.delete({ where: { regNo } });

    addLog("admin@hostel.edu", `Deleted student ${student.regNo} – ${student.name}`);
    res.json({ message: `Student ${student.regNo} deleted.` });
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).json({ error: "Failed to delete student." });
  }
}

// DELETE /api/students (clear all)
async function clearStudents(req, res) {
  try {
    const count = await prisma.students.count();
    await prisma.students.deleteMany({});

    addLog("admin@hostel.edu", `Cleared all ${count} student records`);
    res.json({ message: `All ${count} students removed.` });
  } catch (error) {
    console.error("Error clearing students:", error);
    res.status(500).json({ error: "Failed to clear students." });
  }
}

// POST /api/students/bulk (Excel import)
async function bulkImport(req, res) {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) return res.status(400).json({ error: "rows must be an array." });

    let added = 0, updated = 0, errors = 0;
    const errorDetails = [];

    try {
      let floors = await prisma.floors.findMany();

      // Helper to find or auto-create floor on-the-fly
      async function getOrCreateFloorId(floorVal, hostelName) {
        const strVal = String(floorVal || "1").trim();
        const numVal = parseInt(strVal.replace(/\D/g, ""), 10) || 1;
        const floorName = strVal.toLowerCase().startsWith("floor") ? strVal : `Floor ${numVal}`;

        let existing = floors.find(f => {
          const num = parseInt(f.name.replace(/\D/g, ""), 10);
          return f.id === strVal || f.name.toLowerCase() === floorName.toLowerCase() || String(num) === String(numVal);
        });

        if (existing) return existing.id;

        try {
          const newF = await prisma.floors.create({
            data: {
              name:        floorName,
              capacity:    40,
              hostel:      hostelName || "Men's Hostel",
              description: "Auto-created via Excel Import",
              status:      "Active"
            }
          });
          floors.push(newF);
          return newF.id;
        } catch (e) {
          return floors[0] ? floors[0].id : "f1";
        }
      }

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.regNo || !r.name || !r.dept) {
          errors++;
          errorDetails.push(`Row ${i + 2}: missing regNo / name / dept`);
          continue;
        }

        const hostelVal = String(r.hostel || "Men's Hostel").trim();
        const floorId = await getOrCreateFloorId(r.floor, hostelVal);

        const studentData = {
          regNo:      String(r.regNo).trim().toUpperCase(),
          name:       String(r.name).trim(),
          dept:       String(r.dept).trim().toUpperCase(),
          year:       Number(r.year) || 1,
          semester:   Number(r.semester || r.sem) || 1,
          section:    String(r.section || "").trim().toUpperCase(),
          hostel:     hostelVal,
          floorId:    floorId,
          room:       String(r.room || "").trim(),
          status:     "Active",
        };

        const existing = await prisma.students.findUnique({
          where: { regNo: studentData.regNo }
        });

        if (existing) {
          await prisma.students.update({
            where: { regNo: studentData.regNo },
            data: studentData
          });
          updated++;
        } else {
          await prisma.students.create({
            data: studentData
          });
          added++;
        }
      }
    } catch (dbErr) {
      console.warn("⚠️ DB bulk import error, writing to fallback store:", dbErr.message);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (!r.regNo || !r.name || !r.dept) {
          errors++;
          continue;
        }
        const regNo = String(r.regNo).trim().toUpperCase();
        const hostelVal = String(r.hostel || "Men's Hostel").trim();
        const floorNum = parseInt(String(r.floor || "1").replace(/\D/g, ""), 10) || 1;

        const existingIdx = fallbackStore.students.findIndex(s => s.regNo === regNo);
        const stObj = {
          id: "s_" + Date.now() + "_" + i,
          regNo,
          name: String(r.name).trim(),
          dept: String(r.dept).trim().toUpperCase(),
          year: Number(r.year) || 1,
          semester: Number(r.semester || r.sem) || 1,
          section: String(r.section || "").trim().toUpperCase(),
          hostel: hostelVal,
          floor: floorNum,
          floorId: `f${floorNum}`,
          room: String(r.room || "").trim(),
          status: "Active"
        };

        if (existingIdx !== -1) {
          fallbackStore.students[existingIdx] = stObj;
          updated++;
        } else {
          fallbackStore.students.push(stObj);
          added++;
        }
      }
    }

    addLog("admin@hostel.edu", `Excel import completed: ${added} added, ${updated} updated`);
    res.json({ total: rows.length, added, updated, errors, errorDetails });
  } catch (error) {
    console.error("Error bulk importing students:", error);
    res.status(500).json({ error: "Failed to perform bulk import." });
  }
}

module.exports = {
  listStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  clearStudents,
  bulkImport,
};
