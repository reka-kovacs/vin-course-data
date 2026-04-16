import { MongoClient } from "mongodb";
import { config } from "./config.js";
import { safeDate } from "./db.js";

export async function extractStream(onBatch) {
  const client = new MongoClient(config.mongo.uri);
  await client.connect();

  try {
    const db = client.db(config.mongo.db);
    const collection = db.collection(config.mongo.collection);

    const batchSize = 200;

    // use a cursor to stream data in batches
    const cursor = collection
      .find(
        {
          "course_data.course_id": { $in: config.courseIDs },
        },
        { noCursorTimeout: true },
      )
      .batchSize(batchSize);

    let batch = [];

    // pull data lazily to avoid loading everything into memory at once
    for await (const doc of cursor) {
      batch.push(doc);

      // once we have a full batch, process it and reset
      if (batch.length === batchSize) {
        await onBatch(batch);
        batch = [];
      }
    }

    // process any remaining records in the last batch
    if (batch.length) {
      await onBatch(batch);
    }
  } finally {
    await client.close();
  }
}

export function transform(docs) {
  let records = [];
  let badRecordCount = 0;
  for (const doc of docs) {
    try {
      records.push({
        participant_id: doc.participant_data.participant_id,
        course_id: doc.course_data.course_id,
        course_title: doc.course_data.title,
        first_accessed: safeDate(doc.participant_data?.date_first_accessed),
        last_accessed: safeDate(doc.participant_data?.date_last_accessed),
        completion: isNaN(parseFloat(doc.participant_data?.course_completion))
          ? null
          : parseFloat(doc.participant_data?.course_completion),
      });
    } catch (err) {
      // skip and keep track of bad records
      badRecordCount++;
      console.warn(
        `Skipping bad record for participant_id ${doc.participant_data?.participant_id} and course_id ${doc.course_data?.course_id}:`,
        err,
      );
      console.warn("Bad record:", { doc, error: err });
      continue;
    }
  }

  console.log(`Skipped ${badRecordCount} bad records`);
  return records;
}
