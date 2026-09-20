import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/get-current-user';
import { getInvoiceDetail } from '@/lib/invoice-queries';
import { formatInvoiceAmount, calculateLineTotal } from '@/lib/invoice';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { id } = await params;
    const invoice = await getInvoiceDetail(id, user.id);

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 });
    }

    const issueDateStr = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(invoice.issueDate);

    const dueDateStr = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
    }).format(invoice.dueDate);

    const statusBadgeColor =
      invoice.status === 'PAID'
        ? '#10b981'
        : invoice.status === 'OVERDUE'
        ? '#ef4444'
        : invoice.status === 'CANCELLED'
        ? '#64748b'
        : '#f59e0b';

    const itemsRowsHtml = invoice.items
      .map(
        (item, index) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 16px; font-size: 13px; color: #64748b;">${index + 1}</td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 500; color: #0f172a;">${item.description}</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #334155; text-align: right;">${item.qty}</td>
          <td style="padding: 12px 16px; font-size: 14px; color: #334155; text-align: right;">${formatInvoiceAmount(
            item.price,
            invoice.currency
          )}</td>
          <td style="padding: 12px 16px; font-size: 14px; font-weight: 600; color: #0f172a; text-align: right;">${formatInvoiceAmount(
            calculateLineTotal(item.qty, item.price),
            invoice.currency
          )}</td>
        </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.number} - PayChase</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      padding: 30px;
      max-width: 850px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 24px;
      margin-bottom: 30px;
    }
    .brand {
      display: flex;
      flex-direction: column;
    }
    .logo-container {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .logo-box {
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-weight: 900;
      font-size: 18px;
    }
    .brand-name {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .brand-name span {
      color: #6366f1;
    }
    .sender-details {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
      line-height: 1.4;
    }
    .invoice-title-block {
      text-align: right;
    }
    .invoice-title {
      font-size: 32px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1;
      margin-bottom: 6px;
    }
    .invoice-number {
      font-size: 14px;
      font-weight: 700;
      color: #6366f1;
      font-family: monospace;
    }
    .status-badge {
      display: inline-block;
      margin-top: 8px;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #ffffff;
      background-color: ${statusBadgeColor};
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 30px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .meta-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .meta-value {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }
    .meta-sub {
      font-size: 12px;
      color: #64748b;
      margin-top: 2px;
    }
    .dates-row {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 13px;
    }
    .table-container {
      margin-bottom: 30px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    thead tr {
      background-color: #f1f5f9;
      border-bottom: 1px solid #e2e8f0;
    }
    th {
      padding: 12px 16px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #475569;
    }
    .summary-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 30px;
      margin-bottom: 30px;
    }
    .notes-box {
      flex: 1;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .notes-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
      margin-bottom: 6px;
    }
    .notes-content {
      font-size: 12px;
      color: #334155;
      white-space: pre-wrap;
    }
    .totals-box {
      width: 280px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 13px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-top: 2px solid #e2e8f0;
      padding-top: 10px;
      margin-top: 10px;
    }
    .grand-total-label {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
    }
    .grand-total-val {
      font-size: 20px;
      font-weight: 900;
      color: #4f46e5;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
    }
    .print-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f172a;
      color: white;
      padding: 12px 20px;
      border-radius: 12px;
      margin-bottom: 24px;
    }
    .print-btn {
      background: #4f46e5;
      color: #ffffff;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #4338ca;
    }
    @media print {
      body {
        padding: 0;
      }
      .print-bar {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>Invoice Document • Ready to Save or Print</span>
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <div class="header">
    <div class="brand">
      <div class="logo-container">
        <div class="logo-box">P</div>
        <div class="brand-name">PayChase<span>.</span></div>
      </div>
      <div class="sender-details">
        <strong>${invoice.userName}</strong><br>
        ${invoice.userEmail}
      </div>
    </div>
    <div class="invoice-title-block">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-number">${invoice.number}</div>
      <div class="status-badge">${invoice.status}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div class="meta-box">
      <div class="meta-label">Billed To</div>
      <div class="meta-value">${invoice.clientName}</div>
      <div class="meta-sub">${invoice.clientEmail}</div>
      ${invoice.clientPhone ? `<div class="meta-sub">${invoice.clientPhone}</div>` : ''}
    </div>

    <div class="meta-box">
      <div class="meta-label">Invoice Details</div>
      <div class="dates-row">
        <span style="color: #64748b;">Issue Date:</span>
        <span style="font-weight: 600;">${issueDateStr}</span>
      </div>
      <div class="dates-row">
        <span style="color: #64748b;">Due Date:</span>
        <span style="font-weight: 600;">${dueDateStr}</span>
      </div>
      <div class="dates-row">
        <span style="color: #64748b;">Currency:</span>
        <span style="font-weight: 600;">${invoice.currency}</span>
      </div>
    </div>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 40px;">#</th>
          <th>Description</th>
          <th style="text-align: right; width: 80px;">Qty</th>
          <th style="text-align: right; width: 120px;">Unit Price</th>
          <th style="text-align: right; width: 140px;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRowsHtml}
      </tbody>
    </table>
  </div>

  <div class="summary-section">
    <div class="notes-box">
      <div class="notes-title">Payment Terms & Notes</div>
      <div class="notes-content">${
        invoice.notes
          ? invoice.notes
          : 'Thank you for your business. Please arrange payment on or before the due date.'
      }</div>
    </div>

    <div class="totals-box">
      <div class="total-row">
        <span>Subtotal</span>
        <span>${formatInvoiceAmount(invoice.total, invoice.currency)}</span>
      </div>
      <div class="total-row">
        <span>Tax & Surcharges</span>
        <span>${formatInvoiceAmount(0, invoice.currency)}</span>
      </div>
      <div class="grand-total-row">
        <span class="grand-total-label">Grand Total</span>
        <span class="grand-total-val">${formatInvoiceAmount(invoice.total, invoice.currency)}</span>
      </div>
    </div>
  </div>

  <div class="footer">
    Generated securely by PayChase • Automated Payment Recovery for Creators
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('Invoice PDF Render Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
