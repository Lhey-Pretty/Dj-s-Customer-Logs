import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const CustomerLog = sequelize.define("CustomerLog", {
  activityType: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  transactionReference: { type: DataTypes.STRING, allowNull: true },
  activityAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }
});
