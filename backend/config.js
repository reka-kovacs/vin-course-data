import dotenv from "dotenv";
dotenv.config();

export const config = {
  mongo: {
    uri: process.env.MONGO_URI || "mongodb://localhost:27017",
    db: process.env.MONGO_DB || "ce",
    collection: process.env.MONGO_COLLECTION || "course_data",
  },

  sql: {
    user: process.env.SQL_USER || "SA",
    password: process.env.SQL_PASSWORD || "Huhihuho7065$",
    server: "localhost",
    database: "VIN",
    options: {
      encrypyt: false,
      trustServerCertificate: true,
    },
    authentication: {
      type: "default",
    },
  },

  courseIDs: [
    4209, 4254, 4256, 4257, 4258, 4259, 4260, 4261, 4263, 4262, 4269, 4270,
    4271, 4272, 4274, 4275, 4276,
  ],
};
