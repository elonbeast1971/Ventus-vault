import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { setupServices } from "./services";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const { sendSMS, getAISuggestion } = setupServices(httpServer);

  // Authentication
  app.post("/api/auth/login", (req, res) => {
    res.json({ message: "Login endpoint (placeholder)" });
  });

  // Wallet
  app.get("/api/wallet/balance", (req, res) => {
    res.json({ balance: "0.00", currency: "USD" });
  });

  // Trade
  app.post("/api/trade/execute", (req, res) => {
    res.json({ status: "success", txId: "mock-tx-123" });
  });

  // History
  app.get("/api/history", (req, res) => {
    res.json({ transactions: [] });
  });

  // AI Suggestion
  app.post("/api/ai/suggestion", async (req, res) => {
    const { prompt } = req.body;
    const suggestion = await getAISuggestion(prompt);
    res.json(suggestion);
  });

  // SMS Sending
  app.post("/api/notifications/sms", async (req, res) => {
    const { to, message } = req.body;
    await sendSMS(to, message);
    res.json({ status: "sent" });
  });

  return httpServer;
}
