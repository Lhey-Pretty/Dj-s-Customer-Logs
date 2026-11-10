/*
    Customer Logs Module - Customer Log Service
    Business logic for recording customer interactions
*/

import { CustomerLog } from "../models/CustomerLog.js";
import { Customer } from "../models/Customer.js";
import { AuditService } from "../../../core/AuditService.js";
import { MODULES } from "../../../config/constants.js";

export class CustomerLogService {

  static async recordLog(customerId, logData, userId, ipAddress) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const log = await CustomerLog.create({
        customerId,
        logType: logData.logType,
        sourceModule: logData.sourceModule,
        amount: logData.amount || null,
        description: logData.description,
        staff: logData.staff,
        referenceId: logData.referenceId,
        metadata: logData.metadata || null
      });

      // Update customer's last purchase date if it's a purchase
      if (logData.logType === "PURCHASE" && logData.amount) {
        await customer.increment("totalPurchases", { by: logData.amount });
        customer.lastPurchaseDate = new Date();
        await customer.save();
      }

      await AuditService.logCreate(
        MODULES.CUSTOMER_LOGS,
        "CustomerLog",
        log.logId,
        { userId, description: `Recorded ${logData.logType} for customer`, ipAddress }
      );

      return log;
    } catch (error) {
      throw new Error(`Failed to record log: ${error.message}`);
    }
  }

  static async getCustomerHistory(customerId, limit = 50, offset = 0) {
    try {
      const { count, rows } = await CustomerLog.findAndCountAll({
        where: { customerId },
        order: [["createdAt", "DESC"]],
        limit,
        offset
      });

      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Failed to fetch customer history: ${error.message}`);
    }
  }

  static async getLogsbyType(logType, limit = 50, offset = 0) {
    try {
      const { count, rows } = await CustomerLog.findAndCountAll({
        where: { logType },
        order: [["createdAt", "DESC"]],
        limit,
        offset
      });

      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Failed to fetch logs: ${error.message}`);
    }
  }

  static async getLogsbyModule(sourceModule, limit = 50, offset = 0) {
    try {
      const { count, rows } = await CustomerLog.findAndCountAll({
        where: { sourceModule },
        order: [["createdAt", "DESC"]],
        limit,
        offset
      });

      return { total: count, logs: rows };
    } catch (error) {
      throw new Error(`Failed to fetch module logs: ${error.message}`);
    }
  }

  // Called by other modules to record their activities
  static async recordPurchase(customerId, amount, referenceId, sourceModule, metadata = {}) {
    return this.recordLog(customerId, {
      logType: "PURCHASE",
      sourceModule,
      amount,
      referenceId,
      metadata
    }, null, null);
  }

  static async recordPromoRedemption(customerId, referenceId, sourceModule, metadata = {}) {
    return this.recordLog(customerId, {
      logType: "PROMO_REDEEM",
      sourceModule,
      referenceId,
      metadata
    }, null, null);
  }

  static async recordRefund(customerId, amount, referenceId, sourceModule) {
    return this.recordLog(customerId, {
      logType: "REFUND",
      sourceModule,
      amount,
      referenceId
    }, null, null);
  }
}
