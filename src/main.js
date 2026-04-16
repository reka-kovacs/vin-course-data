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

  await closeConnection();

  console.log("Process completed successfully.");
}

run().catch((err) => {
  console.error("Process failed:", err);
  process.exit(1);
});

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
