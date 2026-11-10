/*
    Customer Logs Module - Customer Service
    Business logic for customer management
*/

import { Customer } from "../models/Customer.js";
import { AuditService } from "../../../core/AuditService.js";
import { MODULES } from "../../../config/constants.js";

export class CustomerService {
  
  static async createCustomer(customerData, userId, ipAddress) {
    try {
      const customer = await Customer.create({
        name: customerData.name,
        contactNumber: customerData.contactNumber,
        email: customerData.email,
        loyaltyPoints: 0,
        totalPurchases: 0
      });

      await AuditService.logCreate(
        MODULES.CUSTOMER_LOGS,
        "Customer",
        customer.customerId,
        { userId, ipAddress }
      );

      return customer;
    } catch (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  static async getCustomerById(customerId) {
    try {
      return await Customer.findByPk(customerId);
    } catch (error) {
      throw new Error(`Failed to fetch customer: ${error.message}`);
    }
  }

  static async getAllCustomers(limit = 50, offset = 0) {
    try {
      const { count, rows } = await Customer.findAndCountAll({
        limit,
        offset,
        order: [["createdAt", "DESC"]]
      });

      return { total: count, customers: rows, page: Math.floor(offset / limit) + 1 };
    } catch (error) {
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  static async updateCustomer(customerId, updates, userId, ipAddress) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      const changes = {};
      for (const [key, value] of Object.entries(updates)) {
        if (customer[key] !== value) {
          changes[key] = { from: customer[key], to: value };
        }
      }

      await customer.update(updates);

      await AuditService.logUpdate(
        MODULES.CUSTOMER_LOGS,
        "Customer",
        customerId,
        { userId, changes, ipAddress }
      );

      return customer;
    } catch (error) {
      throw new Error(`Failed to update customer: ${error.message}`);
    }
  }

  static async deleteCustomer(customerId, userId, ipAddress) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      await customer.destroy();

      await AuditService.logDelete(
        MODULES.CUSTOMER_LOGS,
        "Customer",
        customerId,
        { userId, description: `Deleted customer: ${customer.name}`, ipAddress }
      );

      return { success: true, message: "Customer deleted successfully" };
    } catch (error) {
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  }

  static async searchCustomers(query, limit = 20) {
    try {
      const { Op } = require("sequelize");
      return await Customer.findAll({
        where: {
          [Op.or]: [
            { name: { [Op.like]: `%${query}%` } },
            { email: { [Op.like]: `%${query}%` } },
            { contactNumber: { [Op.like]: `%${query}%` } }
          ]
        },
        limit
      });
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  // For integration: other modules call this to get customer data
  static async getCustomerLoyalty(customerId) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      return {
        customerId: customer.customerId,
        loyaltyPoints: customer.loyaltyPoints,
        totalPurchases: customer.totalPurchases,
        registrationDate: customer.createdAt
      };
    } catch (error) {
      throw new Error(`Failed to fetch loyalty info: ${error.message}`);
    }
  }

  static async addLoyaltyPoints(customerId, points, reason) {
    try {
      const customer = await Customer.findByPk(customerId);
      if (!customer) throw new Error("Customer not found");

      customer.loyaltyPoints += points;
      await customer.save();

      return customer;
    } catch (error) {
      throw new Error(`Failed to update loyalty points: ${error.message}`);
    }
  }
}
