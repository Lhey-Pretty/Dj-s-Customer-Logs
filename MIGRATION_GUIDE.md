# Migration Guide: From Standalone to ERP System

This guide helps you migrate the existing customerLogs code to the new ERP architecture.

## What Changed?

### Before (Old Structure)
```
controllers/ → models/ (directly)
             ↓
            views/
```
- Controllers directly queried models
- No audit logging
- No inter-module communication
- No unified API responses

### After (New Structure)
```
controllers/ → services/ → models/
             ↓              ↓
            views/        AuditLog
             ↓
            /api routes (REST)
```
- Controllers use services
- Automatic audit logging
- Event-based inter-module communication
- Standardized API responses

## Step-by-Step Migration

### 1. Create a Service

**Before:**
```javascript
// controllers/customerLogsController.js
export const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      name: req.body.name,
      contactNumber: req.body.contactNumber,
      email: req.body.email
    });
    res.redirect("/staff/modules/customer-logs?success=Customer created");
  } catch (err) {
    res.redirect("/staff/modules/customer-logs?error=" + err.message);
  }
};
```

**After:**
```javascript
// modules/customerLogs/services/CustomerService.js
export class CustomerService {
  static async createCustomer(customerData, userId, ipAddress) {
    try {
      const customer = await Customer.create({
        name: customerData.name,
        contactNumber: customerData.contactNumber,
        email: customerData.email
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
}
```

### 2. Update Controllers to Use Services

**Before:**
```javascript
// controllers/customerLogsController.js
export const addCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({...});
    res.redirect("/staff/modules/customer-logs?success=Customer created");
  } catch (err) {
    res.redirect("/staff/modules/customer-logs?error=" + err.message);
  }
};
```

**After:**
```javascript
// controllers/customerLogsController.js
import { CustomerService } from "../modules/customerLogs/services/CustomerService.js";

export const addCustomer = async (req, res) => {
  try {
    const customer = await CustomerService.createCustomer(
      req.body,
      req.session?.user?.userId,
      req.ip
    );
    res.redirect("/staff/modules/customer-logs?success=Customer created");
  } catch (err) {
    res.redirect("/staff/modules/customer-logs?error=" + err.message);
  }
};
```

### 3. Add API Endpoints

Create `modules/customerLogs/api/customerApi.js`:
```javascript
import { CustomerService } from "../services/CustomerService.js";
import { ApiResponse, sendApiResponse } from "../../../core/ApiResponse.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const customer = await CustomerService.createCustomer(
      req.body,
      req.user?.userId,
      req.ip
    );
    sendApiResponse(res, ApiResponse.created(customer));
  } catch (error) {
    sendApiResponse(res, ApiResponse.error(error.message));
  }
});

export default router;
```

### 4. Register API in Main App

In `index.js`:
```javascript
import customerApi from "./modules/customerLogs/api/customerApi.js";

// After other middleware...
app.use("/api/customers", customerApi);
```

### 5. Move Models to Module Structure

**Move files:**
```
models/customer.js → modules/customerLogs/models/Customer.js
models/customerLog.js → modules/customerLogs/models/CustomerLog.js
```

**Update imports in models:**
```javascript
// Old
import { sequelize } from "./db.js";

// New
import { sequelize } from "../../../config/database.js";
```

## Updating Existing Controllers

### Example: Dashboard Page

**Before:**
```javascript
export const customerLogsDashboard = async (req, res) => {
  const customers = await Customer.findAll();
  const logs = await CustomerLog.findAll({ limit: 100 });
  
  res.render("module", {
    customers,
    logs,
    title: "Customer Logs"
  });
};
```

**After:**
```javascript
import { CustomerService } from "../modules/customerLogs/services/CustomerService.js";
import { CustomerLogService } from "../modules/customerLogs/services/CustomerLogService.js";

export const customerLogsDashboard = async (req, res) => {
  try {
    const customers = await CustomerService.getAllCustomers(50, 0);
    const logs = await CustomerLogService.getLogsbyModule(MODULES.CUSTOMER_LOGS, 100, 0);
    
    res.render("module", {
      customers: customers.customers,
      logs: logs.logs,
      title: "Customer Logs"
    });
  } catch (error) {
    res.render("error", { error: error.message });
  }
};
```

## Database Changes

### Update Models to New Structure

**Before:**
```javascript
// models/customer.js
export const Customer = sequelize.define("Customer", {
  customerId: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING },
  contactNumber: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING }
});
```

**After:**
```javascript
// modules/customerLogs/models/Customer.js
export const Customer = sequelize.define("Customer", {
  customerId: { type: DataTypes.UUID, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  contactNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, unique: true },
  address: { type: DataTypes.TEXT },
  loyaltyPoints: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalPurchases: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.ENUM("ACTIVE", "INACTIVE", "BLOCKED"), defaultValue: "ACTIVE" },
  lastPurchaseDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
}, {
  timestamps: true,
  indexes: [
    { fields: ["email"] },
    { fields: ["contactNumber"] },
    { fields: ["status"] }
  ]
});
```

### Add Audit Logging

Auto-imports in models:
```javascript
import { Customer } from "../models/Customer.js";

Customer.afterCreate(async (instance) => {
  // Audit logged in service, not here
});
```

## API Response Format

### Update All API Endpoints

**Before:**
```javascript
router.post("/customers", async (req, res) => {
  try {
    const customer = await Customer.create(req.body);
    res.json({ success: true, customer });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
```

**After:**
```javascript
import { ApiResponse, sendApiResponse } from "../../../core/ApiResponse.js";

router.post("/", async (req, res) => {
  try {
    const customer = await CustomerService.createCustomer(req.body, req.user?.userId, req.ip);
    sendApiResponse(res, ApiResponse.created(customer, "Customer created successfully"));
  } catch (error) {
    sendApiResponse(res, ApiResponse.error(error.message, HTTP_STATUS.SERVER_ERROR));
  }
});
```

## Error Handling

### Implement Consistent Error Handling

**Before:**
```javascript
try {
  // code
} catch (err) {
  res.status(500).send(err.message);
}
```

**After:**
```javascript
try {
  // code
} catch (err) {
  sendApiResponse(res, ApiResponse.error(err.message, HTTP_STATUS.SERVER_ERROR));
}
```

## Testing Migration

### 1. Test Service Layer
```javascript
// test/CustomerService.test.js
import { CustomerService } from "../modules/customerLogs/services/CustomerService.js";

describe("CustomerService", () => {
  it("should create a customer", async () => {
    const customer = await CustomerService.createCustomer(
      { name: "John", contactNumber: "09123456789", email: "john@test.com" },
      "userId123",
      "127.0.0.1"
    );
    expect(customer).toBeDefined();
    expect(customer.customerId).toBeDefined();
  });
});
```

### 2. Test API Endpoints
```bash
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "contactNumber": "09123456789",
    "email": "john@test.com"
  }'
```

### 3. Verify Audit Logging
```javascript
// Check audit log table
const auditLogs = await AuditLog.findAll({
  where: {
    module: MODULES.CUSTOMER_LOGS,
    action: AUDIT_ACTIONS.CREATE
  }
});
console.log(auditLogs);
```

## Migration Checklist

- [ ] Create service layer for each domain area
- [ ] Update controllers to use services
- [ ] Create REST API endpoints
- [ ] Update models to new structure
- [ ] Update database configuration
- [ ] Add audit logging to services
- [ ] Update API response formats
- [ ] Test all endpoints
- [ ] Verify audit logs are recorded
- [ ] Update documentation
- [ ] Delete old model files (after models are moved)
- [ ] Remove direct model queries from controllers

## Common Pitfalls

### ❌ Querying models directly in controllers
```javascript
// DON'T DO THIS
const customer = await Customer.findByPk(id);
```

### ✅ Use services
```javascript
// DO THIS
const customer = await CustomerService.getCustomerById(id);
```

### ❌ Forgetting audit logging
```javascript
// DON'T DO THIS
await Customer.create(data);
```

### ✅ Audit through services
```javascript
// DO THIS
await CustomerService.createCustomer(data, userId, ipAddress);
```

### ❌ Inconsistent error responses
```javascript
// DON'T DO THIS
res.json({ error: true, message: error });
res.status(500).send("Error");
```

### ✅ Use ApiResponse
```javascript
// DO THIS
sendApiResponse(res, ApiResponse.error(error.message, HTTP_STATUS.SERVER_ERROR));
```

## Rollback Plan

If something goes wrong during migration:

1. **Keep old code in parallel**: Before deleting controllers, have both old and new running
2. **Feature flags**: Use environment variables to switch between old/new
3. **Database backup**: Always backup before schema changes
4. **Git branches**: Work on separate branch, merge after testing

## Next Steps

1. Create `.env` file with database credentials
2. Run `npm install` to get all dependencies
3. Start server: `npm run dev`
4. Test customer API endpoints
5. Migrate existing controllers one by one
6. Test UI functionality
7. Check audit logs for recorded actions

---

Need help? Check ARCHITECTURE.md for detailed structure information.
