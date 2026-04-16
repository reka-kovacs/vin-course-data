import sql from "mssql";
import { config } from "./config.js";

let pool;
export async function getConnection() {
  // reuse existing connection if available, otherwise create a new one
  if (!pool) {
    pool = sql.connect(config.sql);
  }
  return pool;
}

export async function closeConnection(poolToClose) {
  if (poolToClose) {
    await poolToClose.close();
    pool = null;
  }
}

export async function upsertBatch(pool, batch) {
  if (!batch || batch.length === 0) return;

  const transaction = new sql.Transaction(pool);
  await transaction.begin();

  let result;

  try {
    const request = transaction.request();

    batch.forEach((record, i) => {
      // use parameterized queries to prevent SQL injection and handle data safely
      // not ideal for large batches or complex objects, but works for our simple structure
      request.input(`p${i}`, sql.Int, record.participant_id);
      request.input(`c${i}`, sql.Int, record.course_id);
      request.input(`t${i}`, sql.VarChar(255), record.course_title || null);
      request.input(
        `f${i}`,
        sql.DateTimeOffset,
        safeDate(record.first_accessed),
      );
      request.input(
        `l${i}`,
        sql.DateTimeOffset,
        safeDate(record.last_accessed),
      );
      request.input(`comp${i}`, sql.Float, safeNumber(record.completion));
    });

    const query = buildMergeQuery(batch);

    result = await request.query(query);

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Batch failed:", err);
    throw err;
  }

  // count how many are inserted vs updated for logging
  const rows = result?.recordset || [];
  const count = rows.reduce((acc, row) => {
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
    .join(",");

  const source = `
    (VALUES ${values}) AS source (
      participant_id,
      course_id,
      course_title,
      first_accessed,
      last_accessed,
      completion
    )
  `;

  return `
    DECLARE @actions TABLE (action NVARCHAR(10));

    UPDATE target
    SET 
        target.course_title = source.course_title,
        target.first_accessed = source.first_accessed,
        target.last_accessed = source.last_accessed,
        target.completion = source.completion
    OUTPUT 'UPDATE' INTO @actions
    FROM CourseProgress AS target
    INNER JOIN ${source}
    ON target.participant_id = source.participant_id
    AND target.course_id = source.course_id;

    INSERT INTO CourseProgress (
        participant_id,
        course_id,
        course_title,
        first_accessed,
        last_accessed,
        completion
    )
    OUTPUT 'INSERT' INTO @actions
    SELECT 
        source.participant_id,
        source.course_id,
        source.course_title,
        source.first_accessed,
        source.last_accessed,
        source.completion
    FROM ${source}
    LEFT JOIN CourseProgress AS target
        ON target.participant_id = source.participant_id
        AND target.course_id = source.course_id
    WHERE target.participant_id IS NULL;

    SELECT action FROM @actions;
  `;
}

function safeNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return null;
  return value;
}

export function safeDate(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  let parsed = value;

  if (typeof value === "number" && value < 1e12) {
    // if it's in seconds (10 digits), convert to milliseconds
    parsed = value * 1000;
  }

  const d = new Date(parsed);

  return isNaN(d.getTime()) ? null : d;
}
