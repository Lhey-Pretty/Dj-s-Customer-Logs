# ERP System Architecture

## Overview

This is a modular ERP system where `customerLogs` is one integrated module. The system is designed to eventually connect with multiple modules (POS, Inventory, Accounting, HR & Payroll, Supplier) that share a unified database, event system, and API layer.

## Project Structure

```
customerLogs/
├── config/                        # System-wide configuration
│   ├── constants.js              # Enums and constants (roles, modules, statuses)
│   └── database.js               # Centralized database configuration
│
├── core/                         # Shared services for all modules
│   ├── ApiResponse.js            # Standardized API response format
│   ├── EventEmitter.js           # Inter-module event system
│   └── AuditService.js           # Centralized audit logging
│
├── models/                       # Shared/cross-module models
│   ├── AuditLog.js              # Audit trail for compliance
│   ├── User.js                  # (To be created) Cross-module users
│   └── ...
│
├── modules/
│   ├── customerLogs/            # Customer Logs Module
│   │   ├── models/
│   │   │   ├── Customer.js      # Customer model
│   │   │   └── CustomerLog.js   # Customer interaction log
│   │   ├── services/
│   │   │   ├── CustomerService.js
│   │   │   └── CustomerLogService.js
│   │   ├── api/
│   │   │   ├── customerApi.js   # REST API endpoints
│   │   │   └── customerLogApi.js
│   │   └── controllers/         # UI controllers (legacy, being phased out)
│   │
│   ├── pos/                     # (Future) POS Module
│   │   └── ...
│   ├── inventory/               # (Future) Inventory Module
│   │   └── ...
│   └── ...other modules
│
├── routes/                      # Legacy UI routes
├── controllers/                 # Legacy UI controllers
├── views/                       # UI templates (XianFire)
├── public/                      # Static assets
│
└── index.js                     # Main application entry point
```

## Core Concepts

### 1. **Unified Database**

All modules use a single MySQL database called `erp_system`:
- Created in `config/database.js`
- Uses Sequelize ORM for consistency
- Supports transactions across modules
- Connection pooling optimized for multi-module access

### 2. **API-First Design**

REST APIs allow modules to communicate:
- **Customer API** (`/api/customers`) - for other modules to get/update customer data
- **Customer Logs API** (`/api/customer-logs`) - for recording cross-module interactions

Example: When POS completes a sale → calls `/api/customers/:customerId/loyalty/add` to add loyalty points

### 3. **Event System**

For loose coupling between modules:
```javascript
// In POS module when a sale is made:
eventEmitter.emit("sale.completed", { customerId, amount, referenceId });

// In Customer Logs module:
eventEmitter.on("sale.completed", async (data) => {
  await CustomerLogService.recordLog(data.customerId, {
    logType: "PURCHASE",
    amount: data.amount,
    sourceModule: "pos"
  });
});
```

### 4. **Audit Logging**

All changes are automatically logged to `AuditLog` table:
- Tracks WHO did WHAT to WHICH entity WHEN
- Enables compliance, debugging, and forensics
- Central location: `core/AuditService.js`

Example:
```javascript
await AuditService.logCreate(
  MODULES.CUSTOMER_LOGS,
  "Customer",
  customerId,
  { userId, ipAddress }
);
```

### 5. **Standardized API Responses**

All endpoints return consistent format:
```javascript
{
  "statusCode": 200,
  "data": { /* response data */ },
  "message": "Success",
  "success": true,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## How Modules Integrate

### Customer Logs ↔ POS Module

**When POS makes a sale:**
```
POS Module creates Order
  ↓
POST /api/customer-logs (record purchase)
  ↓
POST /api/customers/:customerId/loyalty/add (add points)
  ↓
CustomerLogs module updates customer loyalty & total purchases
  ↓
Emit "sale.completed" event for other listeners
```

### Customer Logs ↔ Accounting Module

**When Accounting processes a payment:**
```
Accounting module processes Invoice
  ↓
POST /api/customer-logs (record payment)
  ↓
GET /api/customers/:customerId (get customer details)
  ↓
CustomerLogs provides customer history for reconciliation
```

### Customer Logs ↔ Supplier Module

**When Supplier processes a transaction:**
```
Supplier module logs supplier activity
  ↓
(May reference customers in future)
  ↓
Audit trail in AuditLog table
```

## Service Layer Pattern

Each module has a service layer that handles business logic:

```javascript
// Usage in API endpoint
router.post("/", async (req, res) => {
  try {
    const customer = await CustomerService.createCustomer(
      { name, contactNumber, email },
      req.user?.userId,
      req.ip
    );
    sendApiResponse(res, ApiResponse.created(customer));
  } catch (error) {
    sendApiResponse(res, ApiResponse.error(error.message));
  }
});

// Benefits:
// 1. Business logic separated from HTTP layer
// 2. Easy to test without server
// 3. Reusable from other modules
// 4. Audit logging built-in
```

## Constants & Enums

Define all enums in `config/constants.js`:

```javascript
export const MODULES = {
  CUSTOMER_LOGS: "customerLogs",
  POS: "pos",
  INVENTORY: "inventory",
  // ...
};

export const TRANSACTION_TYPES = {
  SALE: "SALE",
  RETURN: "RETURN",
  // ...
};
```

This ensures consistency across all modules.

## Database Models

### Customer
- Stores customer master data
- `loyaltyPoints` - for loyalty program
- `totalPurchases` - aggregate from all transactions
- `lastPurchaseDate` - updated whenever ANY module records a purchase

### CustomerLog
- Tracks every customer interaction
- `sourceModule` - which module recorded this
- `referenceId` - link to transaction in source module
- `metadata` - flexible JSON for module-specific data

### AuditLog
- Logs all CRUD operations on any entity
- Immutable record for compliance
- Queryable by module, action, entity type

## Adding a New Module

Follow this pattern:

### 1. Create Module Structure
```
modules/
└── newModule/
    ├── models/
    │   └── NewModel.js
    ├── services/
    │   └── NewService.js
    ├── api/
    │   └── newApi.js
    └── controllers/ (if needed for UI)
```

### 2. Define Models
```javascript
import { DataTypes } from "sequelize";
import { sequelize } from "../../../config/database.js";

export const NewModel = sequelize.define("NewModel", {
  // fields...
});
```

### 3. Create Services
```javascript
import { AuditService } from "../../../core/AuditService.js";
import { MODULES } from "../../../config/constants.js";

export class NewService {
  static async create(data, userId, ipAddress) {
    const result = await NewModel.create(data);
    await AuditService.logCreate(MODULES.NEW_MODULE, "NewModel", result.id, { userId });
    return result;
  }
}
```

### 4. Create API Routes
```javascript
import { ApiResponse, sendApiResponse } from "../../../core/ApiResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const result = await NewService.create(req.body, req.user?.userId, req.ip);
    sendApiResponse(res, ApiResponse.created(result));
  } catch (error) {
    sendApiResponse(res, ApiResponse.error(error.message));
  }
});
```

### 5. Register in Main App
```javascript
import newApi from "./modules/newModule/api/newApi.js";

app.use("/api/new-resource", newApi);
```

## API Documentation

### Customer Module APIs

#### Get Customer Loyalty
```
GET /api/customers/loyalty/:customerId
Response: { customerId, loyaltyPoints, totalPurchases, registrationDate }
```

#### Add Loyalty Points
```
POST /api/customers/:customerId/loyalty/add
Body: { points: 100, reason: "Purchase" }
```

#### Search Customers
```
GET /api/customers/search?q=john&limit=20
Response: Array of matching customers
```

#### Record Customer Log
```
POST /api/customer-logs
Body: { 
  customerId, 
  logType: "PURCHASE|VISIT|COMPLAINT|PROMO_REDEEM|REFUND",
  sourceModule: "pos|accounting",
  amount: 1000,
  referenceId: "INV-12345",
  metadata: {}
}
```

#### Get Customer History
```
GET /api/customer-logs/:customerId?page=1&limit=20
Response: { total, logs: [...] }
```

## Best Practices

### 1. Always Use Services
- Never query models directly in controllers
- Services handle audit logging
- Easier to test and maintain

### 2. Use Consistent Error Handling
```javascript
try {
  const result = await service.do(data);
  sendApiResponse(res, ApiResponse.success(result));
} catch (error) {
  sendApiResponse(res, ApiResponse.error(error.message, HTTP_STATUS.SERVER_ERROR));
}
```

### 3. Validate Input
```javascript
if (!customerId || !logType) {
  return sendApiResponse(res, ApiResponse.badRequest("customerId and logType required"));
}
```

### 4. Log Significant Actions
```javascript
await AuditService.logCreate(
  MODULES.CUSTOMER_LOGS,
  "Customer",
  customerId,
  { userId, ipAddress }
);
```

### 5. Use Enums from Constants
```javascript
// ❌ Bad
if (logType === "PURCHASE") { ... }

// ✅ Good
import { TRANSACTION_TYPES } from "../../../config/constants.js";
if (logType === TRANSACTION_TYPES.SALE) { ... }
```

## Database Queries & Transactions

For operations spanning multiple modules, use Sequelize transactions:

```javascript
const transaction = await sequelize.transaction();

try {
  // Update customer in Customer Logs
  const customer = await Customer.update(..., { transaction });
  
  // Record log
  const log = await CustomerLog.create(..., { transaction });
  
  // Audit trail
  await AuditLog.create(..., { transaction });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Monitoring & Debugging

### View Audit Trail
```javascript
// Get all customer modifications
const logs = await AuditLog.findAll({
  where: {
    module: MODULES.CUSTOMER_LOGS,
    entityType: "Customer"
  }
});
```

### Check Module Integration
```javascript
// See all interactions from POS module
const posLogs = await CustomerLog.findAll({
  where: { sourceModule: MODULES.POS }
});
```

## Future Enhancements

- [ ] User authentication & authorization middleware
- [ ] Role-based access control (RBAC)
- [ ] Real-time notifications via WebSockets
- [ ] Module versioning & backward compatibility
- [ ] Rate limiting & throttling
- [ ] Distributed caching (Redis)
- [ ] Message queue for async operations (RabbitMQ)
- [ ] Analytics & reporting dashboard
- [ ] Customer 360 dashboard (unified customer view across modules)

## Environment Variables

Create `.env` file (not in git):
```
NODE_ENV=development
PORT=8000
DB_HOST=localhost
DB_NAME=erp_system
DB_USER=root
DB_PASS=
```

Update `config/database.js` to use environment variables:
```javascript
export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  { host: process.env.DB_HOST, dialect: "mysql" }
);
```

---

## Quick Start

1. **Install dependencies**: `npm install`
2. **Start server**: `npm start` or `npm run dev`
3. **Create tables**: Tables auto-sync on startup
4. **Test API**: 
   ```bash
   curl -X POST http://localhost:8000/api/customers \
     -H "Content-Type: application/json" \
     -d '{"name":"John","contactNumber":"09123456789","email":"john@mail.com"}'
   ```

## Support

For questions about module integration, consult this document or check existing module implementations.
