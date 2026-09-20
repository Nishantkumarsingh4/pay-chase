import { describe, it, expect } from 'vitest';
import {
  formatPhoneNumberForWhatsApp,
  generateWhatsAppMessage,
  getWhatsAppDeepLink,
} from '../src/lib/whatsapp';

describe('WhatsApp Reminder Generation & Formatting', () => {
  it('formats 10-digit Indian numbers with 91 prefix', () => {
    expect(formatPhoneNumberForWhatsApp('9876543210')).toBe('919876543210');
    expect(formatPhoneNumberForWhatsApp('+91 98765 43210')).toBe('919876543210');
    expect(formatPhoneNumberForWhatsApp('98765-43210')).toBe('919876543210');
  });

  it('keeps international numbers intact if country code already present', () => {
    expect(formatPhoneNumberForWhatsApp('+1 555 123 4567')).toBe('15551234567');
    expect(formatPhoneNumberForWhatsApp('447911123456')).toBe('447911123456');
  });

  it('generates polite WhatsApp template with payment link and due date', () => {
    const text = generateWhatsAppMessage({
      clientName: 'Sunita Sharma',
      senderName: 'Nishant Studio',
      invoiceNumber: 'INV-0010',
      total: '₹25,000.00',
      dueDate: '25 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-id',
      tone: 'POLITE',
      daysOverdue: 1,
    });

    expect(text).toContain('Sunita Sharma');
    expect(text).toContain('INV-0010');
    expect(text).toContain('₹25,000.00');
    expect(text).toContain('gentle reminder');
    expect(text).toContain('http://localhost:3000/pay/test-id');
  });

  it('generates firm and final notices with urgent keywords', () => {
    const firm = generateWhatsAppMessage({
      clientName: 'Sunita Sharma',
      senderName: 'Nishant Studio',
      invoiceNumber: 'INV-0011',
      total: '₹50,000.00',
      dueDate: '10 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-id-2',
      tone: 'FIRM',
      daysOverdue: 5,
    });
    expect(firm).toContain('Status:* Overdue');

    const final = generateWhatsAppMessage({
      clientName: 'Sunita Sharma',
      senderName: 'Nishant Studio',
      invoiceNumber: 'INV-0012',
      total: '₹1,00,000.00',
      dueDate: '01 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/test-id-3',
      tone: 'FINAL',
      daysOverdue: 15,
    });
    expect(final).toContain('FINAL NOTICE');
    expect(final).toContain('Immediate Payment Required');
  });

  it('generates valid wa.me deep links', () => {
    const link = getWhatsAppDeepLink({
      phone: '9876543210',
      clientName: 'Amit',
      senderName: 'Nishant',
      invoiceNumber: 'INV-0005',
      currency: 'INR',
      total: '₹12,500.00',
      dueDate: '30 Sep 2026',
      viewUrl: 'http://localhost:3000/pay/xyz',
      tone: 'POLITE',
    });

    expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(link).toContain(encodeURIComponent('INV-0005'));
  });
});
