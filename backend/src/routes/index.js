const { Router } = require("express");
const floors = require("../controllers/floors.js");
const students = require("../controllers/students.js");
const rooms = require("../controllers/rooms.js");
const misc = require("../controllers/misc.js");

const r = Router();

// Auth
r.post("/auth/login", misc.login);

// Dashboard
r.get("/dashboard", misc.getDashboard);

// Floors
r.get   ("/floors",     floors.listFloors);
r.post  ("/floors",     floors.createFloor);
r.put   ("/floors/:id", floors.updateFloor);
r.delete("/floors/:id", floors.deleteFloor);

// Students
r.get   ("/students",             students.listStudents);
r.post  ("/students/bulk",        students.bulkImport);
r.delete("/students",             students.clearStudents);
r.get   ("/students/:regNo",      students.getStudent);
r.post  ("/students",             students.createStudent);
r.put   ("/students/:regNo",      students.updateStudent);
r.delete("/students/:regNo",      students.deleteStudent);

// Rooms
r.get   ("/rooms",     rooms.listRooms);
r.post  ("/rooms",     rooms.createRoom);
r.put   ("/rooms/:id", rooms.updateRoom);
r.delete("/rooms/:id", rooms.deleteRoom);

// Users
r.get   ("/users",     misc.listUsers);
r.post  ("/users",     misc.createUser);
r.delete("/users/:id", misc.deleteUser);

// Reports
r.get   ("/reports",     misc.listReports);
r.post  ("/reports",     misc.createReport);
r.delete("/reports/:id", misc.deleteReport);

// Result Analysis
r.get("/result-analysis", misc.getResultAnalysis);

// Logs
r.get("/logs", misc.listLogs);

// Settings
r.get("/settings",  misc.getSettings);
r.put("/settings",  misc.updateSettings);

module.exports = r;
