import sql from "mssql";
import { run } from "../main.js";
import { config } from "../config.js";

describe("Main functions", () => {
  let pool;

  beforeAll(async () => {
    pool = sql.connect(config.sql);
  });

  afterAll(async () => {
    await pool.close();
  });

  test("running twice does not create duplicates", async () => {
    await run();

    const firstCount = await pool.request().query(`
      SELECT COUNT(*) AS count FROM CourseProgress
    `);

    await run();

    const secondCount = await pool.request().query(`
      SELECT COUNT(*) AS count FROM CourseProgress
    `);

    expect(secondCount.recordset[0].count).toBe(firstCount.recordset[0].count);
  });
});
