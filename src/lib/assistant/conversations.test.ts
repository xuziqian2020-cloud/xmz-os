import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"

describe("assistant conversations", () => {
  it("adds Supabase tables for Xiaomei conversation history", () => {
    const source = readFileSync("supabase/migrations/003_assistant_conversations.sql", "utf8")

    assert.match(source, /CREATE TABLE IF NOT EXISTS assistant_conversations/)
    assert.match(source, /CREATE TABLE IF NOT EXISTS assistant_messages/)
    assert.match(source, /conversation_id UUID NOT NULL REFERENCES assistant_conversations/)
    assert.match(source, /ENABLE ROW LEVEL SECURITY/)
    assert.match(source, /auth\.uid\(\) = user_id/)
  })

  it("exposes conversation list and message APIs", () => {
    const conversations = readFileSync("src/app/api/assistant/conversations/route.ts", "utf8")
    const conversationDetail = readFileSync("src/app/api/assistant/conversations/[id]/route.ts", "utf8")
    const messages = readFileSync("src/app/api/assistant/conversations/[id]/messages/route.ts", "utf8")

    assert.match(conversations, /export async function GET/)
    assert.match(conversations, /export async function POST/)
    assert.match(conversations, /from\("assistant_conversations"\)/)
    assert.match(conversationDetail, /export async function PATCH/)
    assert.match(conversationDetail, /export async function DELETE/)
    assert.match(messages, /export async function GET/)
    assert.match(messages, /export async function POST/)
    assert.match(messages, /from\("assistant_messages"\)/)
  })

  it("main assistant page loads history and keeps same-conversation memory", () => {
    const source = readFileSync("src/app/ai-secretary/page.tsx", "utf8")

    assert.match(source, /conversationList/)
    assert.match(source, /activeConversationId/)
    assert.match(source, /loadConversations/)
    assert.match(source, /loadConversationMessages/)
    assert.match(source, /saveConversationMessage/)
    assert.match(source, /readLocalConversationStore/)
    assert.match(source, /writeLocalConversationStore/)
    assert.match(source, /createLocalConversation/)
    assert.match(source, /ensureLocalConversationExists/)
    assert.match(source, /\/api\/assistant\/conversations/)
    assert.match(source, /messagesForAi = nextHistory/)
  })

  it("lets users delete a Xiaomei conversation from history", () => {
    const source = readFileSync("src/app/ai-secretary/page.tsx", "utf8")

    assert.match(source, /deleteConversation/)
    assert.match(source, /removeLocalConversation/)
    assert.match(source, /method: "DELETE"/)
    assert.match(source, /aria-label={`删除对话/)
    assert.match(source, /group-hover/)
  })
})
