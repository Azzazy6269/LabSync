const dotenv = require("dotenv/config");
const {defineConfig} = require("prisma/config");


export default defineConfig({
  schema: "prisma/schemas/",
  migrations: {
    path: "prisma/migrations",
    //seed: 'node ./prisma/seed.js'
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
