import { describe, it, expect } from 'vitest';
import { calculateEscalationTone } from '../src/lib/reminder-service';
import { sendReminderEmail, ReminderTone } from '../src/lib/mailer';


describe('Phase 6: Escalation & Reminder System', () => {
  it('correctly calculates escalation tone based on days overdue', () => {
    // Polite for upcoming or slightly overdue (<= 3 days)
    expect(calculateEscalationTone(0)).toBe('POLITE');
    expect(calculateEscalationTone(1)).toBe('POLITE');
    expect(calculateEscalationTone(3)).toBe('POLITE');

    // Firm for moderately overdue (4 - 7 days)
    expect(calculateEscalationTone(4)).toBe('FIRM');
    expect(calculateEscalationTone(5)).toBe('FIRM');
    expect(calculateEscalationTone(7)).toBe('FIRM');

    // Final for severely overdue (> 7 days)
    expect(calculateEscalationTone(8)).toBe('FINAL');
    expect(calculateEscalationTone(14)).toBe('FINAL');
    expect(calculateEscalationTone(30)).toBe('FINAL');
  });

  it('generates polite reminder email template and dev fallback', async () => {
    const res = await sendReminderEmail({
      to: 'client@example.com',
      clientName: 'Rahul Verma',
      senderName: 'Nishant Design Studio',
      senderEmail: 'nishant@example.com',
      invoiceNumber: 'INV-0001',
      currency: 'INR',
      total: '₹45,000.00',
      dueDate: '20 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-inv-id',
      tone: 'POLITE',
      daysOverdue: 2,
    });

    expect(res.success).toBe(true);
    expect(res.subject).toContain('Friendly reminder: Invoice INV-0001');
    expect(res.messageBody).toContain('gentle reminder');
  });

  it('generates firm overdue notice template', async () => {
    const res = await sendReminderEmail({
      to: 'client@example.com',
      clientName: 'Rahul Verma',
      senderName: 'Nishant Design Studio',
      senderEmail: 'nishant@example.com',
      invoiceNumber: 'INV-0002',
      currency: 'INR',
      total: '₹50,000.00',
      dueDate: '15 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-inv-id-2',
      tone: 'FIRM',
      daysOverdue: 6,
    });

    expect(res.success).toBe(true);
    expect(res.subject).toContain('Payment Overdue: Invoice INV-0002');
    expect(res.messageBody).toContain('remains unpaid');
  });

  it('generates final demand notice template', async () => {
    const res = await sendReminderEmail({
      to: 'client@example.com',
      clientName: 'Rahul Verma',
      senderName: 'Nishant Design Studio',
      senderEmail: 'nishant@example.com',
      invoiceNumber: 'INV-0003',
      currency: 'USD',
      total: '$1,200.00',
      dueDate: '01 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-inv-id-3',
      tone: 'FINAL',
      daysOverdue: 20,
    });

    expect(res.success).toBe(true);
    expect(res.subject).toContain('FINAL NOTICE');
    expect(res.messageBody).toContain('Immediate payment is required');
  });
});
