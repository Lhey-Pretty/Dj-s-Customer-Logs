# Quick Start Guide - ERP System

Get up and running with the new ERP architecture in minutes.

## 1. Setup Database

### Create Database
```sql
CREATE DATABASE erp_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Or use environment variables

Create `.env` file in project root:
```env
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_NAME=erp_system
DB_USER=root
DB_PASS=your_password_here
```

Then update `config/database.js` to use these variables:
```javascript
export const sequelize = new Sequelize(
  process.env.DB_NAME || "erp_system",
  process.env.DB_USER || "root",
  process.env.DB_PASS || "",
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql"
  }
);
```

## 2. Install Dependencies
```bash
npm install
```

## 3. Start Server
```bash
npm start        # Production mode
npm run dev      # Development with auto-reload (nodemon)
npm run xian     # Same as dev
```

Tables will auto-sync on startup. You should see:
```
✅ Database connection established
✅ Database models synced
🔥 XianFire running at http://localhost:8000
```

## 4. Test the API

### Create a Customer
```bash
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "contactNumber": "09123456789",
    "email": "john@example.com"
  }'
```

Response:
```json
{
  "statusCode": 201,
  "data": {
    "customerId": "uuid-here",
    "name": "John Doe",
    "contactNumber": "09123456789",
    "email": "john@example.com",
    "loyaltyPoints": 0,
    "totalPurchases": "0.00",
    "status": "ACTIVE",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  },
  "message": "Customer created successfully",
  "success": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Get Customer Loyalty
```bash
curl http://localhost:8000/api/customers/loyalty/uuid-here
```

Response:
```json
{
  "statusCode": 200,
  "data": {
    "customerId": "uuid-here",
    "loyaltyPoints": 0,
    "totalPurchases": "0.00",
    "registrationDate": "2025-01-15T10:30:00.000Z"
  },
  "message": "Loyalty info retrieved",
  "success": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### Search Customers
```bash
curl "http://localhost:8000/api/customers/search?q=john&limit=10"
```

### Add Loyalty Points
```bash
curl -X POST http://localhost:8000/api/customers/uuid-here/loyalty/add \
  -H "Content-Type: application/json" \
  -d '{"points": 100, "reason": "Purchase"}'
```

### Record Customer Log
```bash
curl -X POST http://localhost:8000/api/customer-logs \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "uuid-here",
    "logType": "PURCHASE",
    "sourceModule": "pos",
    "amount": 1500.00,
    "referenceId": "INV-001",
    "description": "Online purchase",
    "metadata": {"orderNumber": "ORD-123"}
  }'
```

### Get Customer History
```bash
curl "http://localhost:8000/api/customer-logs/uuid-here?page=1&limit=20"
```

## 5. View Audit Logs

Query the database to see all audit logs:
```sql
SELECT * FROM AuditLogs ORDER BY timestamp DESC LIMIT 10;
```

Or via API (if endpoint is exposed):
```bash
curl http://localhost:8000/api/audit-logs?page=1&limit=20
```

## 6. Project Structure Overview

```
customerLogs/
├── config/
│   ├── constants.js              # Enums and constants
│   └── database.js               # Database config
├── core/
│   ├── ApiResponse.js            # API response format
│   ├── EventEmitter.js           # Inter-module events
│   └── AuditService.js           # Audit logging
├── modules/
│   └── customerLogs/
│       ├── models/
│       │   ├── Customer.js
│       │   └── CustomerLog.js
│       ├── services/
│       │   ├── CustomerService.js
│       │   └── CustomerLogService.js
│       └── api/
│           ├── customerApi.js
│           └── customerLogApi.js
├── models/
│   └── AuditLog.js               # Shared audit model
├── routes/                       # Legacy UI routes
├── controllers/                  # Legacy UI controllers
├── views/                        # XianFire templates
├── index.js                      # Main app
├── ARCHITECTURE.md               # Full documentation
├── MIGRATION_GUIDE.md            # How to migrate existing code
└── QUICKSTART.md                 # This file
```

## 7. Add Another Module (POS Example)

### Step 1: Create Module Structure
```bash
mkdir -p modules/pos/models
mkdir -p modules/pos/services
mkdir -p modules/pos/api
```

### Step 2: Create Model
```javascript
// modules/pos/models/Order.js
import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

export const Order = sequelize.define("Order", {
  orderId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  customerId: { type: DataTypes.UUID },
  totalAmount: { type: DataTypes.DECIMAL(10, 2) },
  status: { type: DataTypes.ENUM("PENDING", "COMPLETED", "CANCELLED") }
});
```

### Step 3: Create Service
```javascript
// modules/pos/services/OrderService.js
import { Order } from "../models/Order.js";
import { AuditService } from "../../../core/AuditService.js";
import { MODULES } from "../../../config/constants.js";
import { CustomerLogService } from "../../customerLogs/services/CustomerLogService.js";

export class OrderService {
  static async createOrder(data, userId, ipAddress) {
    const order = await Order.create(data);
    
    // Record in audit
    await AuditService.logCreate(
      MODULES.POS,
      "Order",
      order.orderId,
      { userId, ipAddress }
    );
    
    // Record in customerLogs
    await CustomerLogService.recordPurchase(
      data.customerId,
      data.totalAmount,
      order.orderId,
      MODULES.POS
    );
    
    return order;
  }
}
```

### Step 4: Create API
```javascript
// modules/pos/api/orderApi.js
import express from "express";
import { OrderService } from "../services/OrderService.js";
import { ApiResponse, sendApiResponse } from "../../../core/ApiResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const order = await OrderService.createOrder(
      req.body,
      req.user?.userId,
      req.ip
    );
    sendApiResponse(res, ApiResponse.created(order));
  } catch (error) {
    sendApiResponse(res, ApiResponse.error(error.message));
  }
});

export default router;
```

### Step 5: Register in Main App
```javascript
// index.js
import orderApi from "./modules/pos/api/orderApi.js";

app.use("/api/orders", orderApi);
```

### Step 6: Add to Constants
```javascript
// config/constants.js
export const MODULES = {
  CUSTOMER_LOGS: "customerLogs",
  POS: "pos"  // Add this
};
```

Now the POS module automatically records all orders in CustomerLogs!

## 8. Common Tasks

### Task: Get Top Customers by Purchase Amount
```javascript
import { Customer } from "./modules/customerLogs/models/Customer.js";
import { sequelize } from "./config/database.js";

const topCustomers = await Customer.findAll({
  order: [["totalPurchases", "DESC"]],
  limit: 10
});
```

### Task: Get Recent Purchases
```javascript
import { CustomerLog } from "./modules/customerLogs/models/CustomerLog.js";

const recentPurchases = await CustomerLog.findAll({
  where: { logType: "PURCHASE" },
  order: [["createdAt", "DESC"]],
  limit: 20
});
```

### Task: Get All Activities by Customer
```javascript
import { CustomerLog } from "./modules/customerLogs/models/CustomerLog.js";

const history = await CustomerLog.findAll({
  where: { customerId: "customer-id" },
  order: [["createdAt", "DESC"]]
});
```

### Task: Listen for Purchase Events (Inter-module)
```javascript
import eventEmitter from "./core/EventEmitter.js";

// In any module
eventEmitter.on("purchase.completed", async (data) => {
  console.log("Purchase recorded:", data);
  // Do something...
});

// In POS module
eventEmitter.emit("purchase.completed", {
  customerId: "cust-123",
  amount: 1500,
  orderId: "ord-456"
});
```

## 9. Troubleshooting

### Error: "Database connection failed"
- Check MySQL is running: `mysql --version`
- Check credentials in `.env` or `config/database.js`
- Verify database exists: `SHOW DATABASES;`

### Error: "EADDRINUSE: address already in use :::8000"
- Kill process: `npx kill-port 8000`
- Or change PORT in `.env`

### Error: "Cannot find module"
- Run `npm install`
- Check import paths are correct
- Verify file exists at the path

### Error: "Audit logging failed"
- AuditLog table might not exist
- Server will create it on startup, try restarting
- Check database logs

### No data returned from API
- Check customer ID is correct
- Verify data exists in database: 
  ```sql
  SELECT * FROM Customers LIMIT 1;
  ```

## 10. Next Steps

- [ ] Read ARCHITECTURE.md for detailed information
- [ ] Read MIGRATION_GUIDE.md to migrate existing controllers
- [ ] Create POS module following the example above
- [ ] Create Inventory module
- [ ] Create Accounting module
- [ ] Add authentication middleware
- [ ] Add rate limiting
- [ ] Set up logging service
- [ ] Create dashboard with unified customer view
- [ ] Set up real-time notifications

## NPM Scripts

```bash
npm start               # Start server (production)
npm run dev            # Start with auto-reload
npm run xian           # Same as dev
npm run migrate        # Run migrations (if set up)
npm run create:model   # Interactive model generator
npm run create:controller
npm run route:list     # List all routes
npm run route:cache    # Cache routes
```

## API Documentation

Full API docs are in ARCHITECTURE.md under "API Documentation" section.

Key endpoints:
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get customer
- `GET /api/customers/loyalty/:id` - Get loyalty info
- `POST /api/customers/:id/loyalty/add` - Add points
- `POST /api/customer-logs` - Record log
- `GET /api/customer-logs/:customerId` - Get history

---

**Need help?** Check the documentation files:
- ARCHITECTURE.md - Full system design
- MIGRATION_GUIDE.md - Migrate existing code
- MODULE_TEMPLATE.md - Create new modules

**Questions?** Review the example code in:
- modules/customerLogs/services/
- modules/customerLogs/api/
