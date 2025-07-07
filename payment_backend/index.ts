import express, { Request, Response, NextFunction } from "express";
import axios, { AxiosRequestConfig } from "axios";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient, ServerApiVersion, Db, Collection } from "mongodb";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_PASSWORD = process.env.DB_PASSWORD;
const PAYSTACK_BASE_URL = "https://api.paystack.co";
const DB_NAME = process.env.DB_NAME || "skynet_db";

// Validate environment variables
if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY is required in environment variables");
  process.exit(1);
}

// Validate environment variables
if (!MONGODB_URI) {
  console.error("MONGODB_URI is required in environment variables");
  process.exit(1);
}

if (!DB_PASSWORD) {
  console.error("DB_PASSWORD is required in environment variables");
  process.exit(1);
}

const uri = MONGODB_URI.replace("<db_password>", DB_PASSWORD);
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: Db;
let customersCollection: Collection;
let transactionsCollection: Collection;
let active_users: Collection;

const SERVICE_CONFIG = {
  5: 1,
  110: 30,
  250: 90,
};

// Connect to MongoDB
async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Initialize database and collections
    db = client.db(DB_NAME);
    customersCollection = db.collection("customers");
    transactionsCollection = db.collection("transactions");
    active_users = db.collection("active");

    // Create indexes for better performance
    await createIndexes();

    // Create validation rules
    await createValidationRules();

    console.log("Database and collections initialized successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

async function createValidationRules() {
  try {
    // Customer validation
    await db.command({
      collMod: "customers",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "createdAt", "updatedAt"],
          properties: {
            email: {
              bsonType: "string",
              pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              description: "must be a valid email address",
            },
            createdAt: {
              bsonType: "date",
              description: "must be a date",
            },
            updatedAt: {
              bsonType: "date",
              description: "must be a date",
            },
          },
        },
      },
    });

    // Transaction validation
    await db.command({
      collMod: "transactions",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "paid_on", "expires_on", "service", "amount"],
          properties: {
            email: {
              bsonType: "string",
              pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              description: "must be a valid email address",
            },
            paid_on: {
              bsonType: "date",
              description: "must be a date",
            },
            expires_on: {
              bsonType: "date",
              description: "must be a date",
            },
            service: {
              bsonType: "string",
              description: "must be one of: basic, premium, enterprise",
            },
            amount: {
              bsonType: "number",
              minimum: 0,
              description: "must be a positive number",
            },
          },
        },
      },
    });

    // Active users validation
    await db.command({
      collMod: "active",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["email", "paid_on", "expires_on", "service"],
          properties: {
            email: {
              bsonType: "string",
              pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
              description: "must be a valid email address",
            },
            paid_on: {
              bsonType: "date",
              description: "must be a date",
            },
            expires_on: {
              bsonType: "date",
              description: "must be a date",
            },
            service: {
              bsonType: "string",
              description: "must be one of: basic, premium, enterprise",
            },
          },
        },
      },
    });

    console.log("Validation rules created successfully");
  } catch (error) {
    console.error("Error creating validation rules:", error);
  }
}

// Create database indexes
async function createIndexes() {
  try {
    // Customer indexes - only email field exists
    await customersCollection.createIndex({ email: 1 }, { unique: true });

    // Transaction indexes - email, paid_on, expires_on, service fields
    await transactionsCollection.createIndex({ email: 1 });
    await transactionsCollection.createIndex({ paid_on: -1 }); // -1 for descending (most recent first)
    await transactionsCollection.createIndex({ expires_on: 1 }); // 1 for ascending (earliest expiry first)
    await transactionsCollection.createIndex({ service: 1 });
    // Compound index for common queries
    await transactionsCollection.createIndex({ email: 1, paid_on: -1 });
    await transactionsCollection.createIndex({ service: 1, expires_on: 1 });

    // Active users indexes - email, paid_on, expires_on, service fields
    await active_users.createIndex({ email: 1 });
    await active_users.createIndex({ paid_on: -1 });
    await active_users.createIndex({ expires_on: 1 });
    await active_users.createIndex({ service: 1 });
    // Compound indexes for common queries
    await active_users.createIndex({ email: 1, service: 1 });
    await active_users.createIndex({ service: 1, expires_on: 1 });
    // Index for finding active subscriptions
    await active_users.createIndex({ expires_on: 1, paid_on: -1 });

    console.log("Database indexes created successfully");
  } catch (error) {
    console.error("Error creating indexes:", error);
  }
}

// Types
interface PaystackResponse<T> {
  status: boolean;
  message: string;
  data: T;
  meta?: any;
}

interface PaymentInitializeRequest {
  email: string;
  amount: number | string; // Accept both number and string
}

interface PaymentInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

interface TransactionData {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message: string;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Record<string, any>;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    customer_code: string;
    phone: string;
    metadata: Record<string, any>;
  };
}

interface TransferRequest {
  source?: string;
  amount: number;
  recipient: string;
  reason?: string;
  currency?: string;
  reference?: string;
}

interface WebhookEvent {
  event: string;
  data: any;
}

interface Customer {
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  email: string;
  paid_on: Date;
  expires_on: Date;
  service: string;
  amount: number;
}

interface ActiveUser {
  email: string;
  paid_on: Date;
  expires_on: Date;
  service: string;
}

// Helper function to make Paystack API calls
const paystackAPI = async <T>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data: any = null
): Promise<PaystackResponse<T>> => {
  try {
    const config: AxiosRequestConfig = {
      method,
      url: `${PAYSTACK_BASE_URL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message);
  }
};

// Routes

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", message: "Payment backend is running" });
});

// Initialize payment
app.post("/api/payment/initialize", async (req: Request, res: Response) => {
  try {
    const { email, amount }: PaymentInitializeRequest = req.body;

    // Validate required fields
    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Email and amount are required",
      });
    }

    // Convert amount to number if it's a string
    const numericAmount =
      typeof amount === "string" ? parseFloat(amount) : amount;

    // Validate that amount is a valid number
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    const paymentData = {
      email,
      amount: numericAmount,
    };

    const result = await paystackAPI<PaymentInitializeResponse>(
      "/transaction/initialize",
      "POST",
      paymentData
    );

    res.json({
      success: true,
      data: result.data,
      message: "Payment initialized successfully",
    });
  } catch (error: any) {
    console.error("Initialize payment error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Verify payment
app.get(
  "/api/payment/verify/:reference",
  async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;

      if (!reference) {
        return res.status(400).json({
          success: false,
          message: "Payment reference is required",
        });
      }

      const result = await paystackAPI<TransactionData>(
        `/transaction/verify/${reference}`
      );

      res.json({
        success: true,
        data: result.data,
        message: "Payment verification successful",
      });
    } catch (error: any) {
      console.error("Verify payment error:", error.message);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

// Webhook endpoint
app.post("/api/webhook/paystack", (req: Request, res: Response) => {
  try {
    const event: WebhookEvent = req.body;

    // Handle different event types
    switch (event.event) {
      case "charge.success":
        console.log("Payment successful:", event.data);
        // Handle successful payment
        handleSuccessfulPayment(event.data);
        break;

      case "charge.failed":
        console.log("Payment failed:", event.data);
        // Handle failed payment
        handleFailedPayment(event.data);
        break;

      case "transfer.success":
        console.log("Transfer successful:", event.data);
        // Handle successful transfer
        break;

      case "transfer.failed":
        console.log("Transfer failed:", event.data);
        // Handle failed transfer
        break;

      default:
        console.log("Unhandled event:", event.event);
    }

    res.status(200).json({
      success: true,
      message: "Webhook received successfully",
    });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Database Status
app.get("/api/database/status", async (req: Request, res: Response) => {
  try {
    await client.db("admin").command({ ping: 1 });

    const collections = await db.listCollections().toArray();
    const stats = {
      customers: await customersCollection.countDocuments(),
      transactions: await transactionsCollection.countDocuments(),
      transfers: await active_users.countDocuments(),
    };

    res.json({
      success: true,
      message: "Database is connected and operational",
      collections: collections.map((col) => col.name),
      documentCounts: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
});

// Database helper functions
async function createOrUpdateCustomer(
  customerData: Partial<Customer>
): Promise<Customer> {
  const now = new Date();

  const customer: Customer = {
    email: customerData.email,
    createdAt: now,
    updatedAt: now,
  };

  try {
    await customersCollection.insertOne(customer);
    console.log(`Customer created: ${customer.email}`);
    return customer;
  } catch (error: any) {
    // If duplicate email, update existing customer
    if (error.code === 11000) {
      const updateData = {
        ...customerData,
        updatedAt: now,
      };
      delete updateData.email; // Don't update email
      delete updateData.createdAt; // Don't update creation date

      await customersCollection.updateOne(
        { email: customerData.email },
        { $set: updateData }
      );

      const updatedCustomer = await customersCollection.findOne({
        email: customerData.email,
      });
      console.log(`Customer updated: ${customerData.email}`);
      return updatedCustomer!;
    }
    throw error;
  }
}

async function createOrUpdateActiveUser(
  userData: Partial<ActiveUser>
): Promise<ActiveUser> {
  const now = new Date();

  const activeUser: ActiveUser = {
    email: userData.email!,
    paid_on: userData.paid_on!,
    expires_on: userData.expires_on!,
    service: userData.service!,
  };

  try {
    await active_users.insertOne(activeUser);
    console.log(`Active user created: ${activeUser.email}`);
    return activeUser;
  } catch (error: any) {
    // If duplicate email, update existing active user
    if (error.code === 11000) {
      const updateData = {
        paid_on: userData.paid_on,
        expires_on: userData.expires_on,
        service: userData.service,
      };

      await active_users.updateOne(
        { email: userData.email },
        { $set: updateData }
      );

      const updatedUser = await active_users.findOne({ email: userData.email });
      console.log(`Active user updated: ${userData.email}`);
      return updatedUser!;
    }
    throw error;
  }
}

async function createTransaction(
  transactionData: Partial<Transaction>
): Promise<Transaction> {
  const now = new Date();

  const transaction: Transaction = {
    email: transactionData.email!,
    paid_on: transactionData.paid_on || now,
    expires_on: transactionData.expires_on!,
    service: transactionData.service!,
    amount: transactionData.amount!,
  };

  await transactionsCollection.insertOne(transaction);
  return transaction;
}

// Helper function to calculate expiry date
function calculateExpiryDate(
  amount: number,
  paidDate: Date = new Date()
): Date {
  let days: number = 1;

  if (amount === 500) {
    days = 1;
  } else if (amount === 11000) {
    days = 30;
  } else if (amount === 25000) {
    days = 90;
  }

  const expiryDate = new Date(paidDate);
  expiryDate.setDate(expiryDate.getDate() + days);
  return expiryDate;
}

// Helper functions for webhook handling
async function handleSuccessfulPayment(
  paymentData: TransactionData
): Promise<void> {
  // Implement your business logic here
  try {
    const paidDate = new Date(paymentData.paid_at);
    const expiryDate = calculateExpiryDate(paymentData.amount, paidDate);

    // Create or update customer
    await createOrUpdateCustomer({
      email: paymentData.customer.email,
    });

    // Create transaction record
    await createTransaction({
      email: paymentData.customer.email,
      paid_on: paidDate,
      expires_on: expiryDate,
      service: "SKYNET",
      amount: paymentData.amount,
    });

    // Create or update active user
    await createOrUpdateActiveUser({
      email: paymentData.customer.email,
      paid_on: paidDate,
      expires_on: expiryDate,
      service: "SKYNET",
    });
  } catch (error: any) {
    console.error("Error processing successful payment:", error.message);
  }

  // e.g., update database, send confirmation email, etc.
}

function handleFailedPayment(paymentData: TransactionData): void {
  // Implement your business logic here
  // e.g., update database, send failure notification, etc.
  console.log("Processing failed payment:", {
    reference: paymentData.reference,
    amount: paymentData.amount,
    customer: paymentData.customer.email,
  });
}

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Global error handler:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Payment backend running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(
        `Database status: http://localhost:${PORT}/api/database/status`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
export default app;
