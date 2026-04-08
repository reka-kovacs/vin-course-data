import sql from "mssql";
import { config } from "./config.js";

let pool;
export async function getConnection() {
  pool = await sql.connect(config.sql);
  return pool;
}

export async function upsertBatch(pool, batch) {
  if (!batch || batch.length === 0) return;
  const request = pool.request();

  batch.forEach((record, i) => {
    // Use parameterized queries to prevent SQL injection and handle data safely
    request.input(`p${i}`, sql.Int, record.participant_id);
    request.input(`c${i}`, sql.Int, record.course_id);
    request.input(`t${i}`, sql.VarChar(255), record.course_title || null);
    request.input(`f${i}`, sql.DateTimeOffset, safeDate(record.first_accessed));
    request.input(`l${i}`, sql.DateTimeOffset, safeDate(record.last_accessed));
    request.input(`comp${i}`, sql.Float, safeNumber(record.completion));
  });

  const query = buildMergeQuery(batch);
  // need to await the query here to ensure it completes before moving on to the next batch
  // otherwise we might have multiple concurrent requests that could cause issues
  const result = await request.query(query);

  // count how many are inserted vs updated for logging
  const count = result.recordset.reduce((acc, row) => {
    acc[row.action] = (acc[row.action] || 0) + 1;
    return acc;
  }, {});
  console.log(
    `Batch upsert completed: inserted=${count.INSERT || 0}, updated=${count.UPDATE || 0}`,
  );
}

function buildMergeQuery(batch) {
  const values = batch
    .map((_, i) => `(@p${i}, @c${i}, @t${i}, @f${i}, @l${i}, @comp${i})`)
    .join(",\n");

  return `
    MERGE CourseProgress AS target
    USING (VALUES ${values})
    AS source (participant_id, course_id, course_title, first_accessed, last_accessed, completion)

    ON target.participant_id = source.participant_id
       AND target.course_id = source.course_id

    WHEN MATCHED THEN
      UPDATE SET 
        course_title = source.course_title,
        first_accessed = source.first_accessed,
        last_accessed = source.last_accessed,
        completion = source.completion

    WHEN NOT MATCHED THEN
      INSERT (participant_id, course_id, course_title, first_accessed, last_accessed, completion)
      VALUES (source.participant_id, source.course_id, source.course_title, source.first_accessed, source.last_accessed, source.completion)

      OUTPUT $action AS action;
  `;
}

// only used for tvp method, but can be adapted for parameterized queries if needed
// function createTVP(batch) {
//   const table = new sql.Table("VIN.dbo.CourseProgressType");
//   table.create = true; // safe to create if necessary

//   // Columns must exactly match the SQL TVP type
//   table.columns.add("participant_id", sql.Int);
//   table.columns.add("course_id", sql.Int);
//   table.columns.add("course_title", sql.VarChar(sql.MAX));
//   table.columns.add("first_accessed", sql.DateTimeOffset);
//   table.columns.add("last_accessed", sql.DateTimeOffset);
//   table.columns.add("completion", sql.Float);

//   // Add rows safely
//   for (const r of batch) {
//     table.rows.add(
//       r.participant_id,
//       r.course_id,
//       r.course_title || null,
//       r.first_accessed ? new Date(r.first_accessed) : null,
//       r.last_accessed ? new Date(r.last_accessed) : null,
//       r.completion != null ? parseFloat(r.completion) : null,
//     );
//   }

//   return table;
// }

function safeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return value;
}

export function safeDate(value) {
  if (!value) return null;

  // 13-digit timestamp in milliseconds
  if (typeof value === "number" && value.toString().length === 13) {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  // ISO string or Date object
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}
