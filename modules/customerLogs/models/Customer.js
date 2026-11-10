/*
    Customer Logs Module - Enhanced Customer Model
    Now integrated as part of ERP system
*/

import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

export const Customer = sequelize.define("Customer", {
  customerId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  loyaltyPoints: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Accumulated loyalty points for redemption"
  },
  totalPurchases: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: "Total purchase amount from all modules (POS, etc)"
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE", "BLOCKED"),
    defaultValue: "ACTIVE"
  },
  lastPurchaseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ["email"] },
    { fields: ["contactNumber"] },
    { fields: ["status"] }
  ]
});
