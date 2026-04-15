import { MongoClient } from "mongodb";
import { config } from "./config.js";
import { safeDate } from "./db.js";

export async function extract() {
  const client = new MongoClient(config.mongo.uri);
  await client.connect();

  const db = client.db(config.mongo.db);
  const collection = db.collection(config.mongo.collection);

  const batchSize = 200;

  const cursor = collection
    .find({
      "course_data.course_id": { $in: config.courseIDs },
    })
    .batchSize(batchSize);

  const docs = [];

  let batch = [];

  for await (const doc of cursor) {
    batch.push(doc);

    if (batch.length === batchSize) {
      docs.push(...batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    docs.push(...batch);
  }

  await client.close();
  return docs;
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
        completion: parseFloat(doc.participant_data?.course_completion) || null,
      });
    } catch (err) {
      // skip and keep track of bad records
      badRecordCount++;
      console.warn(
        `Skipping bad record for participant_id ${doc.participant_data?.participant_id} and course_id ${doc.course_data?.course_id}:`,
        err,
      );
      continue;
    }
  }

  console.log(`Skipped ${badRecordCount} bad records`);
  return records;
}
