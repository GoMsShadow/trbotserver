// db.js
const dotenv = require("dotenv");
dotenv.config();

const { sql } = require("@vercel/postgres");

const createParamsTable = async () => {};

const generateParamsTable = async () => {
  try {
    await sql`ALTER TABLE params 
              ADD COLUMN IF NOT EXISTS apikey VARCHAR(255),
              ADD COLUMN IF NOT EXISTS apisecret VARCHAR(255)`;
    console.log("Added 'apikey' and 'apisecret' columns to 'trade_params' table.");
  } catch (error) {
    console.error("Error adding columns to 'trade_params' table: ", error);
  }

};

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
  await generateParamsTable();
  await createSymbolsTable();
  await createSearchesTable();
};

migrate();
