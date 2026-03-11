require('dotenv').config();
const { getMetadataArgsStorage } = require("typeorm");

module.exports = {
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'qwerty1',
  database: process.env.DB_DATABASE || 'realworld_db',
  synchronize: false,
  entities: getMetadataArgsStorage().tables.map(tbl => tbl.target),
  timezone: 'Z',
  bigNumberStrings: false,
  migrations: ["migrations/*.js"],
  migrationsRun: false,
  cli: {
    migrationsDir: "migrations"
  },
  extra: {
    // connectionLimit: 5
  }
}