import { describe, it, expect } from 'vitest';
import {
  calculateTotal,
  calculateLineTotal,
  computeInvoiceStatus,
  formatInvoiceNumber,
} from '../src/lib/invoice';
import { invoiceFormSchema } from '../src/lib/validations/invoice';

describe('Invoice Math & Decimal Calculations', () => {
  it('should handle floating point trickiness: 3 x 33.33 exactly equals 99.99', () => {
    // In native JS float: 3 * 33.33 = 99.99000000000001
    const line = calculateLineTotal(3, 33.33);
    expect(line).toBe('99.99');

    const total = calculateTotal([{ description: 'Item 1', qty: 3, price: 33.33 }]);
    expect(total).toBe('99.99');
  });

  it('should handle classic float precision problem: 0.1 + 0.2 equals 0.30', () => {
    // In native JS float: 0.1 + 0.2 = 0.30000000000000004
    const total = calculateTotal([
      { description: 'Item 1', qty: 1, price: 0.1 },
      { description: 'Item 2', qty: 1, price: 0.2 },
    ]);
    expect(total).toBe('0.30');
  });

  it('should calculate zero price correctly', () => {
    const total = calculateTotal([
      { description: 'Free tier', qty: 5, price: 0 },
      { description: 'Consultation', qty: 2, price: 0 },
    ]);
    expect(total).toBe('0.00');
  });

  it('should handle large amounts without overflow or exponent notation', () => {
    const total = calculateTotal([
      { description: 'Enterprise Project', qty: 10, price: 5000000 },
    ]);
    expect(total).toBe('50000000.00');
  });

  it('should round half up properly for fractions', () => {
    // 1.5 qty * 10.35 price = 15.525 -> rounded to 15.53
    const line = calculateLineTotal(1.5, 10.35);
    expect(line).toBe('15.53');
  });
});

describe('computeInvoiceStatus Edge Cases', () => {
  const formatLocalYMD = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = formatLocalYMD(new Date());
  const yesterdayStr = formatLocalYMD(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const tomorrowStr = formatLocalYMD(new Date(Date.now() + 24 * 60 * 60 * 1000));

  it('should retain status if already PAID, even if dueDate is past', () => {
    expect(computeInvoiceStatus(yesterdayStr, 'PAID')).toBe('PAID');
    expect(computeInvoiceStatus(todayStr, 'PAID')).toBe('PAID');
  });

  it('should retain status if CANCELLED, even if dueDate is past', () => {
    expect(computeInvoiceStatus(yesterdayStr, 'CANCELLED')).toBe('CANCELLED');
    expect(computeInvoiceStatus(tomorrowStr, 'CANCELLED')).toBe('CANCELLED');
  });

  it('should transition PENDING to OVERDUE if dueDate is before today', () => {
    expect(computeInvoiceStatus(yesterdayStr, 'PENDING')).toBe('OVERDUE');
  });

  it('should remain PENDING if dueDate is today', () => {
    expect(computeInvoiceStatus(todayStr, 'PENDING')).toBe('PENDING');
  });

  it('should remain PENDING if dueDate is in the future', () => {
    expect(computeInvoiceStatus(tomorrowStr, 'PENDING')).toBe('PENDING');
  });
});

describe('Invoice Number Formatting', () => {
  it('should format numbers with 4-digit zero-padding', () => {
    expect(formatInvoiceNumber(1)).toBe('INV-0001');
    expect(formatInvoiceNumber(42)).toBe('INV-0042');
    expect(formatInvoiceNumber(999)).toBe('INV-0999');
    expect(formatInvoiceNumber(1000)).toBe('INV-1000');
    expect(formatInvoiceNumber(12345)).toBe('INV-12345');
  });
});

describe('Zod Invoice Validation Schema', () => {
  const validData = {
    clientId: 'cl_1234567890abcdef',
    currency: 'INR' as const,
    issueDate: '2026-09-20',
    dueDate: '2026-09-27',
    notes: 'Thank you for your business.',
    items: [
      {
        description: 'Web Development Services',
        qty: 1,
        price: 50000,
      },
    ],
  };

  it('should accept valid invoice input', () => {
    const parsed = invoiceFormSchema.safeParse(validData);
    expect(parsed.success).toBe(true);
  });

  it('should reject when dueDate is before issueDate', () => {
    const invalidDates = {
      ...validData,
      issueDate: '2026-09-27',
      dueDate: '2026-09-20',
    };
    const parsed = invoiceFormSchema.safeParse(invalidDates);
    expect(parsed.success).toBe(false);
  });

  it('should reject empty items array', () => {
    const invalidItems = {
      ...validData,
      items: [],
    };
    const parsed = invoiceFormSchema.safeParse(invalidItems);
    expect(parsed.success).toBe(false);
  });

  it('should reject negative price or zero qty', () => {
    const invalidQty = {
      ...validData,
      items: [{ description: 'Test', qty: 0, price: 100 }],
    };
    expect(invoiceFormSchema.safeParse(invalidQty).success).toBe(false);

    const negativePrice = {
      ...validData,
      items: [{ description: 'Test', qty: 1, price: -50 }],
    };
    expect(invoiceFormSchema.safeParse(negativePrice).success).toBe(false);
  });

  it('should reject prices with more than 2 decimal places', () => {
    const invalidDecimals = {
      ...validData,
      items: [{ description: 'Fraction test', qty: 1, price: 10.999 }],
    };
    expect(invoiceFormSchema.safeParse(invalidDecimals).success).toBe(false);
  });

  it('should reject unsupported currencies', () => {
    const invalidCurrency = {
      ...validData,
      currency: 'JPY',
    };
    expect(invoiceFormSchema.safeParse(invalidCurrency).success).toBe(false);
  });

  it('should reject notes exceeding 1000 characters', () => {
    const invalidNotes = {
      ...validData,
      notes: 'a'.repeat(1001),
    };
    expect(invoiceFormSchema.safeParse(invalidNotes).success).toBe(false);
  });
});
