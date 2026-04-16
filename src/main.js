import { extractStream, transform } from "./transform.js";
import { getConnection, upsertBatch, closeConnection } from "./db.js";

export async function run() {
  console.log("Starting process...");

  const pool = await getConnection();

  let processed = 0;

  await extractStream(async (docsBatch) => {
    const records = transform(docsBatch);
    await upsertBatch(pool, records);

    processed += records.length;
    console.log(`Processed ${processed} records`);
  });

  await closeConnection(pool);

  console.log("Process completed successfully.");
}

run().catch((err) => {
  console.error("Process failed:", err);
  process.exit(1);
});
