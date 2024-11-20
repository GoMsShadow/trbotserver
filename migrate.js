// db.js
const dotenv = require("dotenv");
dotenv.config();

const { sql } = require("@vercel/postgres");

const createParamsTable = async () => {};

const createSymbolsTable = async () => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS symbols (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`;
    console.log("Table 'symbols' created successfully.");
  } catch (error) {
    console.error("Error creating 'symbols' table: ", error);
  }
};

const createSearchesTable = async () => {
  try {
    await sql`CREATE TABLE IF NOT EXISTS searches (id SERIAL PRIMARY KEY, symbol VARCHAR(255) NOT NULL, count INTEGER NOT NULL DEFAULT 1)`;
    console.log("Table 'searches' created successfully.");
  } catch (error) {
    console.error("Error creating 'searches' table: ", error);
  }
};

const migrate = async () => {
  await createParamsTable();
  await createSymbolsTable();
  await createSearchesTable();
};

migrate();
