# ⚡ PayChase — Automated Invoice Chasing & Billing Platform

<p align="center">
  <b>Stop chasing payments manually. Automate invoice reminders, tracking, and escalations with surgical precision.</b>
</p>

---

## 📌 Project Overview

**PayChase** is an automated invoice chasing and receivable management platform built for freelancers, agencies, and businesses to eliminate the friction of manually following up on unpaid invoices.

From instant invoice generation and one-click issuing to automated client notifications, tone-escalated overdue reminders, and payment tracking — PayChase handles the entire billing lifecycle on autopilot.

---

## ⚙️ How It Works

```
1. Create & Issue Invoice
         ↓
2. Instant Email Sent to Client (with Payment Link)
         ↓
3. Background Autopilot Checks Overdue Invoices
         ↓
4. Tone Escalation Reminders (Polite → Firm → Final)
         ↓
5. Client Settles via Payment Gateway (Public Pay Link)
         ↓
6. Auto-Marked as PAID & Chasing Stops
```

### 1. Create & Issue Invoice
- The user selects a client, defines deliverables, line items, quantities, unit prices, tax rate, and set the due date.
- With a single click on **"Save & Issue Invoice"**, the invoice is created and stored in the database.

### 2. Instant Email Dispatch
- The moment the invoice is saved, the platform **immediately dispatches a branded, itemized invoice email** to the client containing full details and a secure payment link.
- The interface displays an interactive **3-second animated countdown confirmation** and automatically redirects to the invoice details page.
- The primary action button instantly updates to **"Resend email"**, displaying the exact date and timestamp of delivery.

### 3. Background Autopilot Monitoring
- An automated in-process background worker daemon actively monitors the database for unpaid and overdue invoices.
- It operates completely hands-free — users do not need to keep the dashboard open or execute manual follow-up tasks.

### 4. Smart 3-Stage Tone Escalation
If an invoice remains unpaid past its due date, PayChase automatically escalates reminder notices based on the number of days overdue:
- 🟢 **Stage 1 (1 - 3 Days Overdue) — Polite Nudge:** A courteous, friendly reminder assuming the client simply overlooked the invoice.
- 🟡 **Stage 2 (4 - 7 Days Overdue) — Firm Notice:** A direct follow-up highlighting the missed deadline and requesting a payment status update.
- 🔴 **Stage 3 (> 7 Days Overdue) — Final Notice:** An urgent, formal demand requesting immediate settlement to avoid service disruptions.
- **Anti-Spam 48-Hour Cooldown:** To prevent inbox spamming, an automated cooldown ensures no client receives repeat automatic reminders within 48 hours for the same invoice.

### 5. Client Payment Page & Payment Gateway
- The email includes a direct, frictionless link to a public payment page (`/pay/[id]`) that clients can view without creating an account or logging in.
- **Integrated Payment Gateway:** Clients can click **"Pay Now"** to securely settle the invoice online via credit/debit card, UPI, or net banking.
- Once the payment succeeds, the invoice status is atomically updated to **PAID**, and all future reminder chasers for that invoice are immediately terminated.

### 6. Full Dispatch History & Manual Resend
- Every communication sent (channel, recipient email, tone, subject, and timestamp) is recorded in an audit trail.
- Users can review the chronological **Dispatch History** timeline directly on the invoice details page.
- Users can also trigger an on-demand reminder anytime using the **"Resend email"** action.
