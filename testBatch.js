import { getConnection, upsertBatch } from "./db.js";

async function test() {
  const pool = await getConnection();

  // Sample batch of test records
  const batch = [
    {
      participant_id: 101,
      course_id: 4209,
      course_title: "Test Course A",
      first_accessed: Date.now(), // 13-digit timestamp
      last_accessed: Date.now(),
      completion: 0.5,
    },
    {
      participant_id: 102,
      course_id: 4254,
      course_title: "Test Course B",
      first_accessed: Date.now() - 1000000,
      last_accessed: Date.now() - 500000,
      completion: 0.8,
    },
  ];

  try {
    await upsertBatch(pool, batch);
    console.log("Test batch upsert completed successfully.");
  } catch (err) {
    console.error("Test batch upsert failed:", err);
  } finally {
    pool.close();
  }
}

test();
