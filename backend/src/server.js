const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" })); // Vite dev server
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);

// Health-check
app.get("/", (req, res) => res.json({ status: "ok", service: "HAPAMS API", version: "1.0.0" }));

app.listen(PORT, () => {
  console.log(`✅  HAPAMS backend running on http://localhost:${PORT}`);
});
