# 🔥 ERP System - Customer Logs Module

Welcome to the refactored ERP System! This document provides an overview of the system and guides you to the right documentation.

## 📋 What is This?

A modular **ERP (Enterprise Resource Planning) System** where:
- **Customer Logs** is your current module
- **POS, Inventory, Accounting, HR & Payroll, Supplier** modules will connect here
- All modules share one database, one API layer, and one audit system
- Modules communicate via REST APIs and events

Think of it as a connected ecosystem where every module can talk to every other module.

## 🎯 Quick Links

### I want to...

- **Get started in 5 minutes** → Read [QUICKSTART.md](./QUICKSTART.md)
- **Understand the architecture** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Migrate existing code** → Read [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Add a new module (POS, Inventory, etc)** → Read [MODULE_TEMPLATE.md](./modules/MODULE_TEMPLATE.md)
- **Deploy to production** → Read [DEPLOYMENT.md](./DEPLOYMENT.md)
- **See the system diagram** → Check the [Architecture Diagram](#-system-architecture) below

## 📁 Project Structure

```
customerLogs/
├── config/                      # System configuration
│   ├── constants.js            # Enums (roles, modules, statuses)
│   └── database.js             # Database connection
│
├── core/                       # Shared services
│   ├── ApiResponse.js          # Standardized API responses
│   ├── EventEmitter.js         # Inter-module events
│   └── AuditService.js         # Audit logging
│
├── models/
│   └── AuditLog.js             # Audit trail model
│
├── modules/
│   ├── customerLogs/           # Your current module
│   │   ├── models/             # Customer, CustomerLog
│   │   ├── services/           # Business logic
│   │   └── api/                # REST endpoints
│   │
│   ├── pos/                    # (Future) POS Module
│   ├── inventory/              # (Future) Inventory
│   └── ...
│
├── QUICKSTART.md              # 👈 Start here
├── ARCHITECTURE.md            # Complete system design
├── MIGRATION_GUIDE.md         # Move existing code here
├── DEPLOYMENT.md              # Deploy to production
└── README_ERP.md              # This file
```

## 🏗️ System Architecture

```
External Systems / Other Modules
    ↓
REST API Layer (/api/...)
    ↓
Service Layer (Business Logic)
    ↓
Model Layer (Database Models)
    ↓
MySQL Database
```

Each module has:
- **Models** - Define data structure
- **Services** - Handle business logic & audit logging
- **API** - REST endpoints for other modules

## 🚀 Getting Started (3 steps)

### 1. Setup
```bash
npm install
```

### 2. Configure Database
Create `.env`:
```env
DB_HOST=localhost
DB_NAME=erp_system
DB_USER=root
DB_PASS=
```

### 3. Run
```bash
npm start
```

Server runs at `http://localhost:8000`

## 📊 Core Concepts

### 1. Unified API Responses
Every API endpoint returns the same format:
```json
{
  "statusCode": 200,
  "data": { /* your data */ },
  "message": "Success",
  "success": true,
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 2. Automatic Audit Logging
Every create/update/delete is logged:
```sql
-- AuditLog table tracks everything
SELECT * FROM AuditLogs;
-- Shows: WHO did WHAT to WHICH ENTITY WHEN
```

### 3. Event-Based Communication
Modules communicate without direct coupling:
```javascript
// POS module makes a sale
eventEmitter.emit("sale.completed", { customerId, amount });

// CustomerLogs module listens
eventEmitter.on("sale.completed", (data) => {
  // Update loyalty points, record purchase, etc.
});
```

### 4. Service Layer Pattern
All business logic in services:
```javascript
// Services handle complex operations
const customer = await CustomerService.createCustomer(data, userId, ipAddress);
// Automatically: creates record, logs audit, emits event
```

## 🔌 API Endpoints

### Customer Management
```bash
POST   /api/customers                    # Create customer
GET    /api/customers                    # List customers
GET    /api/customers/:id                # Get one customer
PUT    /api/customers/:id                # Update customer
DELETE /api/customers/:id                # Delete customer
GET    /api/customers/search?q=name      # Search customers
```

### Loyalty Program
```bash
GET    /api/customers/loyalty/:id        # Get loyalty info
POST   /api/customers/:id/loyalty/add    # Add loyalty points
```

### Customer Logs
```bash
POST   /api/customer-logs                # Record interaction
GET    /api/customer-logs/:customerId    # Get customer history
GET    /api/customer-logs/type/:type     # Get logs by type
```

Full API docs in [ARCHITECTURE.md](./ARCHITECTURE.md#api-documentation)

## 🔄 How Modules Integrate

### Example: POS → Customer Logs

1. POS creates an order
2. POS calls `/api/customer-logs` to record purchase
3. POS calls `/api/customers/:id/loyalty/add` to add points
4. POS emits `sale.completed` event
5. CustomerLogs listens and updates customer data
6. All actions logged to AuditLog table

Result: Complete customer history across all modules!

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `config/constants.js` | All enums and constants |
| `config/database.js` | Database configuration |
| `core/ApiResponse.js` | Standardized responses |
| `core/AuditService.js` | Audit logging logic |
| `core/EventEmitter.js` | Inter-module events |
| `modules/customerLogs/services/CustomerService.js` | Customer logic |
| `modules/customerLogs/api/customerApi.js` | Customer REST API |

## ✅ What You Can Do Now

- ✅ Create/read/update/delete customers
- ✅ Track customer purchase history
- ✅ Manage loyalty points
- ✅ Automatic audit trail
- ✅ Inter-module communication via events
- ✅ Standardized API responses

## 🔮 What's Coming

- 🚀 POS Module - Point of sale transactions
- 📦 Inventory Module - Stock management
- 💰 Accounting Module - Financial records
- 👥 HR Module - Employee management
- 💳 Payroll Module - Salary processing
- 🏭 Supplier Module - Vendor management

Each will integrate with CustomerLogs automatically!

## 🛠️ Development Workflow

### Create New Feature
1. Add fields to model in `modules/customerLogs/models/`
2. Add logic to service in `modules/customerLogs/services/`
3. Add endpoint to API in `modules/customerLogs/api/`
4. Test with curl
5. Update ARCHITECTURE.md

### Integrate Another Module (e.g., POS)
1. Create `modules/pos/` directory
2. Follow [MODULE_TEMPLATE.md](./modules/MODULE_TEMPLATE.md)
3. Call CustomerLogs APIs from POS services
4. Listen to events in POS
5. Done! POS now integrated

### Debug Issues
1. Check `AuditLog` table for who did what
2. Enable console logging temporarily
3. Check `.env` configuration
4. Verify database connection
5. Check `/api/health` endpoint

## 📖 Documentation

- **QUICKSTART.md** - 5-minute setup guide
- **ARCHITECTURE.md** - Complete system design (100+ lines)
- **MIGRATION_GUIDE.md** - Migrate existing code to ERP
- **MODULE_TEMPLATE.md** - Template for new modules
- **DEPLOYMENT.md** - Production checklist
- **This file** - Overview

Start with QUICKSTART.md if you haven't already!

## 💡 Pro Tips

### Tip 1: Use Services, Not Models Directly
```javascript
// ❌ Don't do this
const customer = await Customer.findByPk(id);

// ✅ Do this
const customer = await CustomerService.getCustomerById(id);
```

### Tip 2: Audit Logging is Automatic
```javascript
// Just use the service - audit logging happens automatically
await CustomerService.createCustomer(data, userId, ipAddress);
// ✅ Audit log recorded
```

### Tip 3: Test APIs with curl
```bash
# Create customer
curl -X POST http://localhost:8000/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name":"John","contactNumber":"09123456789"}'

# Get customer
curl http://localhost:8000/api/customers/[id]
```

### Tip 4: Use Constants
```javascript
// ❌ Don't hardcode strings
if (status === "ACTIVE") { ... }

// ✅ Use constants
import { PROMO_STATUS } from "./config/constants.js";
if (status === PROMO_STATUS.ACTIVE) { ... }
```

### Tip 5: Emit Events for Other Modules
```javascript
// When something important happens, emit an event
eventEmitter.emit("customer.created", { customerId, name });

// Other modules can listen
eventEmitter.on("customer.created", (data) => {
  // Send welcome email, etc.
});
```

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check if MySQL is running
mysql --version

# Check .env variables
cat .env

# Test connection
mysql -h localhost -u root
```

### "Cannot find module"
```bash
# Reinstall dependencies
npm install

# Check import paths
# Make sure file exists at that path
```

### "Port 8000 already in use"
```bash
# Find and kill process
lsof -i :8000
kill -9 [PID]

# Or use different port
PORT=8001 npm start
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for more troubleshooting.

## 🎓 Learning Path

1. **Day 1**: Read QUICKSTART.md, get server running
2. **Day 2**: Read ARCHITECTURE.md, understand design
3. **Day 3**: Create a test customer via API
4. **Day 4**: Read MIGRATION_GUIDE.md
5. **Day 5**: Migrate first controller to services
6. **Week 2**: Create POS module using MODULE_TEMPLATE.md
7. **Week 3**: Integrate POS with CustomerLogs
8. **Week 4**: Deploy to staging

## 📞 Support

- Check relevant documentation file
- Review code examples in `modules/customerLogs/`
- Look at existing services for patterns
- Check ARCHITECTURE.md for detailed explanations

## 🎯 Next Steps

1. **Start here**: [QUICKSTART.md](./QUICKSTART.md)
2. **Then read**: [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **For existing code**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
4. **New modules**: [MODULE_TEMPLATE.md](./modules/MODULE_TEMPLATE.md)
5. **Going live**: [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🎉 Welcome to the ERP System!

You now have a solid foundation for:
- ✅ Managing customers
- ✅ Tracking interactions
- ✅ Loyalty programs
- ✅ Audit trails
- ✅ Multi-module integration

Let's build the rest together! 🚀

---

**Made with ❤️ using XianFire Framework & Node.js**

For detailed API documentation and architecture diagrams, see [ARCHITECTURE.md](./ARCHITECTURE.md)
