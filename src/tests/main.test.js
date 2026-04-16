import sql from "mssql";
import { run } from "../main.js";
import { config } from "../config.js";
import { getConnection, closeConnection } from "../db.js";

describe("Main functions", () => {
  let pool;

  beforeAll(async () => {
    pool = await getConnection();
  });

  afterAll(async () => {
    await pool.request().query(`TRUNCATE TABLE CourseProgress`);
    await closeConnection(pool);
  });

  test("running twice does not create duplicates", async () => {
    await run();
    const first = await pool
      .request()
      .query(`SELECT COUNT(*) AS count FROM CourseProgress`);

    await run();
    const second = await pool
      .request()
      .query(`SELECT COUNT(*) AS count FROM CourseProgress`);

    expect(second.recordset[0].count).toBe(first.recordset[0].count);
  });
});
