import express from "express";
import cors from "cors";
import { getConnection } from "./db.js";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/progress", async (req, res) => {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT 
        participant_id,
        course_id,
        course_title,
        completion,
        first_accessed,
        last_accessed
      FROM dbo.CourseProgress
      ORDER BY participant_id
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
});

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
