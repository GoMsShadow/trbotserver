// db.js
const { sql } = require("@vercel/postgres");

async function createTable() {
  try {
    await sql`CREATE TABLE IF NOT EXISTS symbols (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL)`;
    console.log("Table 'symbols' created successfully.");
  } catch (error) {
    console.error("Error creating table: ", error);
  }
}

createTable();
