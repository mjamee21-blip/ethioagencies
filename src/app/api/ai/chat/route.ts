import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { processAgencyAIQuery } from "@/lib/ai/assistant";
import { db } from "@/db";
import { aiConversations } from "@/db/schema";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query, confirmedAction, conversationId } = body;

    if (!query && !confirmedAction) {
      return NextResponse.json({ error: "Query or confirmedAction is required" }, { status: 400 });
    }

    const agencyId = session.agencyId;
    const userId = session.userId;

    const aiResponse = await processAgencyAIQuery(agencyId, query || "Execute confirmed action", confirmedAction);

    // Save conversation / chat history in db
    try {
      if (conversationId) {
        // Update existing conversation messages
        const existingConv = await db.query.aiConversations.findFirst({
          where: (c, { and, eq }) => and(eq(c.id, conversationId), eq(c.agencyId, agencyId)),
        });
        if (existingConv) {
          const messages = Array.isArray(existingConv.messages) ? existingConv.messages : [];
          messages.push({ role: "user", content: query, timestamp: new Date().toISOString() });
          messages.push({ role: "assistant", content: aiResponse.answer, data: aiResponse.data, timestamp: new Date().toISOString() });

          await db
            .update(aiConversations)
            .set({ messages, updatedAt: new Date() })
            .where(eq(aiConversations.id, conversationId));
        }
      } else {
        // Create new conversation
        await db.insert(aiConversations).values({
          agencyId,
          userId,
          title: query ? query.substring(0, 50) : "AI Chat Session",
          messages: [
            { role: "user", content: query, timestamp: new Date().toISOString() },
            { role: "assistant", content: aiResponse.answer, data: aiResponse.data, timestamp: new Date().toISOString() },
          ],
        });
      }
    } catch (dbErr) {
      console.error("Failed to persist AI conversation:", dbErr);
    }

    return NextResponse.json(aiResponse);
  } catch (error: any) {
    console.error("AI Chat API Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
