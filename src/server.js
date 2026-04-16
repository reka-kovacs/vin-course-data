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
        last_accessed
      FROM dbo.CourseProgress
      ORDER BY participant_id, course_id
    `);

    const rows = result.recordset;

    const participantsSet = new Set();
    const coursesMap = new Map();
    const matrix = {};

    for (const row of rows) {
      const p = String(row.participant_id);
      const c = String(row.course_id);

      participantsSet.add(p);

      if (!coursesMap.has(c)) {
        coursesMap.set(c, {
          id: c,
          title: row.course_title || `Course ${c}`,
        });
      }

      if (!matrix[p]) matrix[p] = {};

      matrix[p][c] = {
        completion: row.completion,
        last_accessed: row.last_accessed || row.first_accessed || null,
      };
    }

    res.json({
      participants: Array.from(participantsSet),
      courses: Array.from(coursesMap.values()),
      matrix,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch crosstab data" });
  }
});

app.listen(3001, () => {
  console.log("API running on http://localhost:3001");
});
