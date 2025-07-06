import express, { Request, Response, NextFunction } from "express";
import axios, { AxiosRequestConfig } from "axios";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = "https://api.paystack.co";

// Validate environment variables
if (!PAYSTACK_SECRET_KEY) {
  console.error("PAYSTACK_SECRET_KEY is required in environment variables");
  process.exit(1);
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

interface CustomerRequest {
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  metadata?: Record<string, any>;
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

// Get transaction details
app.get("/api/transaction/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await paystackAPI<TransactionData>(`/transaction/${id}`);

    res.json({
      success: true,
      data: result.data,
      message: "Transaction details retrieved successfully",
    });
  } catch (error: any) {
    console.error("Get transaction error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// List transactions
app.get("/api/transactions", async (req: Request, res: Response) => {
  try {
    const { perPage = 50, page = 1, customer, status, from, to } = req.query;

    let endpoint = `/transaction?perPage=${perPage}&page=${page}`;

    if (customer) endpoint += `&customer=${customer}`;
    if (status) endpoint += `&status=${status}`;
    if (from) endpoint += `&from=${from}`;
    if (to) endpoint += `&to=${to}`;

    const result = await paystackAPI<TransactionData[]>(endpoint);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
      message: "Transactions retrieved successfully",
    });
  } catch (error: any) {
    console.error("List transactions error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

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

// Get customer
app.get("/api/customer/email/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const result = await paystackAPI<any>(`/customer/${email}`);

    res.json({
      success: true,
      data: result.data,
      message: "Customer retrieved successfully",
    });
  } catch (error: any) {
    console.error("Get customer by email error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Initialize transfer
app.post("/api/transfer/initialize", async (req: Request, res: Response) => {
  try {
    const {
      source,
      amount,
      recipient,
      reason,
      currency = "NGN",
      reference,
    }: TransferRequest = req.body;

    if (!amount || !recipient) {
      return res.status(400).json({
        success: false,
        message: "Amount and recipient are required",
      });
    }

    const transferData = {
      source: source || "balance",
      amount: currency === "NGN" ? amount * 100 : amount,
      recipient,
      reason: reason || "Transfer",
      currency,
      reference: reference || `transfer_${Date.now()}`,
    };

    const result = await paystackAPI<any>("/transfer", "POST", transferData);

    res.json({
      success: true,
      data: result.data,
      message: "Transfer initialized successfully",
    });
  } catch (error: any) {
    console.error("Initialize transfer error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Helper functions for webhook handling
function handleSuccessfulPayment(paymentData: TransactionData): void {
  // Implement your business logic here
  // e.g., update database, send confirmation email, etc.
  console.log("Processing successful payment:", {
    reference: paymentData.reference,
    amount: paymentData.amount,
    customer: paymentData.customer.email,
  });
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
app.listen(PORT, () => {
  console.log(`Payment backend running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
