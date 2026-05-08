# 📄 Technical Flow Document

**Product:** Multi-Model AI API (Pay-Per-Request)

---

## 1. 🧠 System Overview

```
Client (SDK / App)
        ↓
API Gateway (Your Backend)
        ↓
┌──────────────────────────────┐
│ Auth Service                 │
│ Billing Service              │
│ Model Router                 │
│ Usage Logger                 │
└──────────────────────────────┘
        ↓
LLM Providers
(e.g. Together AI, Groq)
```

---

## 2. 🔄 Main Request Flow (End-to-End)

1. Client sends request
2. Authenticate API key
3. Validate request
4. Estimate cost
5. Check user balance
6. Reserve credits
7. Route to model provider
8. Execute request
9. Calculate actual usage
10. Deduct balance
11. Log usage
12. Return response

---

## 3. 🔍 Detailed Flow (Step-by-Step)

### 3.1 Incoming Request

**Endpoint**

```
POST /v1/chat/completions
```

**Example Request**

```json
{
  "model": "llama-3",
  "messages": [
    { "role": "user", "content": "Hello" }
  ]
}
```

---

### 3.2 Authentication Flow

Extract API Key → Validate → Fetch User

**Logic**

```js
const apiKey = req.headers.authorization;

const user = await db.users.findOne({ apiKey });

if (!user) throw new Error("Unauthorized");
```

---

### 3.3 Request Validation

Check:

- Model exists
- Messages format valid
- Input size limit

---

### 3.4 Cost Estimation (Pre-check)

Estimate tokens → estimate cost

**Example**

```js
const estimatedTokens = estimateTokens(req.messages);
const estimatedCost = estimatedTokens * pricePerToken;
```

---

### 3.5 Balance Check

```js
if (user.balance < estimatedCost) {
  throw new Error("Insufficient balance");
}
```

---

### 3.6 Credit Reservation (IMPORTANT)

Prevent race conditions:

```js
await db.users.update({
  id: user.id,
  balance: user.balance - estimatedCost
});
```

👉 This is a temporary deduction

---

### 3.7 Model Routing Flow

Model → Provider → Endpoint

**Example Mapping**

```js
const modelMap = {
  "llama-3": "together",
  "qwen-2.5": "together"
};
```

**Router Logic**

```js
function route(model) {
  switch(modelMap[model]) {
    case "together":
      return callTogether;
    case "groq":
      return callGroq;
  }
}
```

---

### 3.8 Provider Call Flow

**Example (Together AI)**

```js
async function callTogether(req) {
  return fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.TOGETHER_KEY}`
    },
    body: JSON.stringify({
      model: req.model,
      messages: req.messages
    })
  });
}
```

---

### 3.9 Response Handling

Normalize response:

```js
const output = providerResponse.choices[0].message.content;
const usage = providerResponse.usage;
```

---

### 3.10 Final Cost Calculation

```js
const actualCost =
  usage.input_tokens * inputPrice +
  usage.output_tokens * outputPrice;
```

---

### 3.11 Balance Adjustment

```js
const refund = estimatedCost - actualCost;

await db.users.update({
  id: user.id,
  balance: user.balance + refund
});
```

---

### 3.12 Usage Logging

```js
await db.usage.insert({
  user_id: user.id,
  model: req.model,
  tokens: usage.total_tokens,
  cost: actualCost,
  created_at: new Date()
});
```

---

### 3.13 Final Response

```json
{
  "id": "chatcmpl_xxx",
  "model": "llama-3",
  "output": "Hello!",
  "usage": {
    "input_tokens": 10,
    "output_tokens": 20
  }
}
```

---

## 4. ⚠️ Error Handling Flow

### 4.1 Provider Failure

Provider fails → retry OR fallback model

```js
try {
  return await callTogether(req);
} catch {
  return await callGroq(req);
}
```

---

### 4.2 Refund on Failure

```js
await refundFull(user.id, estimatedCost);
```

---

### 4.3 Invalid Request

Return:

```json
{
  "error": "Invalid model"
}
```

---

## 5. 🔐 Security Flow

- API key required
- Rate limiting per user
- Max tokens per request
- Prevent negative balance

---

## 6. 📊 Billing Flow

### Top-up

User pays → payment success → add balance

```js
user.balance += payment.amount;
```

### Deduction

Each request → deduct cost

### Optional: Minimum balance check

Block if:

```js
balance < $0.01
```

---

## 7. 🧩 Optional Advanced Flows

### 7.1 Streaming Flow (future)

```
Client → stream chunks → provider stream → forward to client
```

### 7.2 Smart Routing (future)

```
if (cheap_task) use llama
if (coding) use better model
```

### 7.3 RAG Integration (future)

```
User query → retrieve docs → inject context → LLM
```

---

## 8. 🚀 Performance Considerations

- Cache frequent prompts
- Async logging (don't block response)
- Connection pooling
- Timeout handling

---

## 9. 🧠 Key Design Principles

### 1. Never lose money

Always:

- Estimate first
- Reserve credits

### 2. Normalize everything

All providers → same response format

### 3. Keep it simple first

No over-engineering in MVP

---

## 10. ✅ Final Flow Summary

```
Request
 ↓
Auth
 ↓
Validate
 ↓
Estimate cost
 ↓
Check balance
 ↓
Reserve credits
 ↓
Route to provider
 ↓
Execute request
 ↓
Calculate actual cost
 ↓
Adjust balance
 ↓
Log usage
 ↓
Return response
```
