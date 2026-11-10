/*
    Customer Logs Module - Customer Log Model
    Tracks customer interactions and transactions across modules
*/

import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";
import { Customer } from "./Customer.js";

export const CustomerLog = sequelize.define("CustomerLog", {
  logId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Customer,
      key: "customerId"
    }
  },
  logType: {
    type: DataTypes.ENUM(
      "PURCHASE",
      "VISIT",
      "INQUIRY",
      "COMPLAINT",
      "FOLLOW_UP",
      "PROMO_REDEEM",
      "REFUND"
    ),
    allowNull: false,
    comment: "Type of customer interaction"
  },
  sourceModule: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Which module recorded this (POS, Accounting, etc)"
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: "Transaction amount if applicable"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  staff: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Staff member who handled the interaction"
  },
  referenceId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Invoice number, Order ID, etc from source module"
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: "Additional data from source module"
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ["customerId"] },
    { fields: ["logType"] },
    { fields: ["sourceModule"] },
    { fields: ["createdAt"] }
  ]
});

// Association
Customer.hasMany(CustomerLog, { foreignKey: "customerId" });
CustomerLog.belongsTo(Customer, { foreignKey: "customerId" });
