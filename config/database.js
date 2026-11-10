/*
    ERP System - Centralized Database Configuration
    All modules share this connection
*/

import { Sequelize } from "sequelize";

export const sequelize = new Sequelize("erp_system", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
}

export async function syncDatabase(force = false) {
  try {
    await sequelize.sync({ force });
    console.log("✅ Database models synced");
  } catch (error) {
    console.error("❌ Database sync failed:", error);
    throw error;
  }
}
