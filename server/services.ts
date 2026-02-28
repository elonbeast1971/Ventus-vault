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
  //    In a true notifications microservice this logic would live in its
  //    own process (could be Node.js/Go) and expose an HTTP endpoint or
  //    message queue consumer.  We simulate here for the monolith/demo.
  const sendSMS = async (to: string, message: string) => {
    console.log(`[SMS Simulation] To: ${to}, Message: ${message}`);
    // In production, read credentials from env and call the provider:
    // const sid = process.env.TWILIO_ACCOUNT_SID!;
    // const token = process.env.TWILIO_AUTH_TOKEN!;
    // const client = new Twilio(sid, token);
    // await client.messages.create({ body: message, to, from: process.env.TWILIO_FROM_NUMBER });
  };

  // 3. Mock AI Assistant
  //    The real service could be a Python microservice exposing a REST or
  //    gRPC API, or simply a wrapper around OpenAI/other LLMs.  Frontend
  //    hits `/api/ai/suggestion` and this module forwards the request.
  const getAISuggestion = async (prompt: string): Promise<AIResponse> => {
    // Example placeholder; in production make HTTP call to AI engine
    return { suggestion: `AI suggestion for: ${prompt} (Mocked)` };
  };

  return { io, sendSMS, getAISuggestion };
}
