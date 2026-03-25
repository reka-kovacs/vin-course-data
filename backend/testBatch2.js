import sql from "mssql";

const config = {
  user: "SA",
  password: "Huhihuho7065$",
  server: "localhost",
  database: "VIN",
  options: { encrypt: false, trustServerCertificate: true },
};

async function run() {
  // 1️⃣ Connect first
  pool
    .connect()
    .then((pool) => {
      return pool.request();
    })
    .then((result) => {
      console.log("result");
    })
    .catch((err) => {
      // Handle errors
    });

  // 2️⃣ Create TVP AFTER connection
  const pool = await sql.connect(config);
  console.log(pool);

  //   // 2️⃣ Create TVP AFTER connection
  //   const tvp = new sql.Table("dbo.CourseProgressType"); // include schema
  //   tvp.columns.add("participant_id", sql.Int);
  //   tvp.columns.add("course_id", sql.Int);
  //   tvp.columns.add("course_title", sql.VarChar(sql.MAX));
  //   tvp.columns.add("first_accessed", sql.DateTimeOffset);
  //   tvp.columns.add("last_accessed", sql.DateTimeOffset);
  //   tvp.columns.add("completion", sql.Float);

  //   // 3️⃣ Add rows, replacing undefined with null
  //   tvp.rows.add(
  //     1,
  //     4209,
  //     "Test Course",
  //     new Date(), // first_accessed
  //     new Date(), // last_accessed
  //     0.5,
  //   );

  //   // Optional: explicitly set database if needed
  //   tvp.database = "VIN";
  //   //   console.log(tvp);

  //   // 4️⃣ Create request AFTER TVP
  //   const request = pool.request();
  //   console.log(request);

  //   // 5️⃣ Register TVP
  //   request.input("Batch", tvp, "dbo.CourseProgressType");

  //   //   // 6️⃣ Test query
  //   //   const result = await request.query("SELECT * FROM @Batch");
  //   //   console.log(result.recordset);

  pool.close();
}

run().catch(console.error);
