import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Customer = sequelize.define("Customer", {
  customerId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  contactNumber: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: true }
});
