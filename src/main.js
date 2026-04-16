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

  // would normally close the connection here, we need it for testing and it's not a long-running process, so we can leave it open until the process exits
  // await closeConnection(pool);

  console.log("Process completed successfully.");
}

run().catch((err) => {
  console.error("Process failed:", err);
  process.exit(1);
});
