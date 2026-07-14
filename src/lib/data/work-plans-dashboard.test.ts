import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyDashboardWorkPlanQuery } from "./work-plans"

type QueryCall = {
  method: string
  column?: string
  value?: unknown
  options?: unknown
}

class QueryRecorder {
  calls: QueryCall[] = []

  select(value: string) {
    this.calls.push({ method: "select", value })
    return this
  }

  is(column: string, value: unknown) {
    this.calls.push({ method: "is", column, value })
    return this
  }

  order(column: string, options?: unknown) {
    this.calls.push({ method: "order", column, options })
    return this
  }

  limit(value: number) {
    this.calls.push({ method: "limit", value })
    return this
  }
}

describe("dashboard work plan query", () => {
  it("uses due date as the dashboard loading rule instead of truncating by created time", () => {
    const query = new QueryRecorder()

    applyDashboardWorkPlanQuery(query)

    const orderCalls = query.calls.filter((call) => call.method === "order")
    assert.equal(orderCalls[0]?.column, "due_date")
    assert.equal(orderCalls[orderCalls.length - 1]?.column, "created_at")
    assert.equal(query.calls.some((call) => call.method === "limit"), false)
    assert.deepEqual(query.calls.filter((call) => call.method === "is"), [
      { method: "is", column: "deleted_at", value: null },
    ])
  })
})
