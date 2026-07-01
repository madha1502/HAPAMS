const express = require("express");
const cors = require("cors");
const routes = require("./routes/index.js");

const app = express();
const PORT = process.env.PORT || 5000;

// Strip trailing slash to prevent CORS mismatch (e.g. "https://hapams.vercel.app/" vs "https://hapams.vercel.app")
const clientOrigin = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "10mb" }));

app.use("/api", routes);

// Health-check
app.get("/", (req, res) => res.json({ status: "ok", service: "HAPAMS API", version: "1.0.0" }));

app.listen(PORT, () => {
  console.log(`✅  HAPAMS backend running on http://localhost:${PORT}`);
});
