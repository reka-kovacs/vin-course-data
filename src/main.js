import { extract, transform } from "./transform.js";
import { getConnection, upsertBatch } from "./db.js";

export async function run() {
  console.log("Starting process...");

  const docs = await extract();
  console.log(`Fetched ${docs.length} documents`);

  const records = transform(docs);
  console.log(`Transformed into ${records.length} records`);

  const pool = await getConnection();

  const batches = chunkArray(records, 200);
  let processed = 0;

  for (const batch of batches) {
    await upsertBatch(pool, batch);
    processed += batch.length;
    console.log(`Processed ${processed} records...`);
  }

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
