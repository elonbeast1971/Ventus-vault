import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { Twilio } from "twilio";

// Types for clarity
interface AIResponse {
  suggestion: string;
}

export function setupServices(httpServer: HttpServer) {
  // 1. WebSocket for Real-time Updates
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected to WebSocket");
    socket.on("disconnect", () => console.log("Client disconnected"));
  });

  // 2. Mock SMS Sending (Twilio Placeholder)
  const sendSMS = async (to: string, message: string) => {
    console.log(`[SMS Simulation] To: ${to}, Message: ${message}`);
    // In production, use process.env.TWILIO_ACCOUNT_SID etc.
    // const client = new Twilio(sid, token);
    // await client.messages.create({ body: message, to, from: '...' });
  };

  // 3. Mock AI Assistant
  const getAISuggestion = async (prompt: string): Promise<AIResponse> => {
    return { suggestion: `AI suggestion for: ${prompt} (Mocked)` };
  };

  return { io, sendSMS, getAISuggestion };
}
