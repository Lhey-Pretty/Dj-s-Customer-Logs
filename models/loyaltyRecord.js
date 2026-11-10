import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const LoyaltyRecord = sequelize.define("LoyaltyRecord", {
  pointsBalance: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  tier: { type: DataTypes.STRING, allowNull: false, defaultValue: "Regular" }
});
