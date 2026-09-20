import { describe, it, expect } from 'vitest';
import { clientSchema } from '../src/lib/validations/client';

describe('Zod Client Validation Schema', () => {
  it('should accept valid client data and normalize email to lowercase', () => {
    const raw = {
      name: '  Rahul Sharma  ',
      email: '  Rahul.Sharma@AcmeCorp.COM  ',
      phone: '+91 98765-43210',
    };

    const parsed = clientSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe('Rahul Sharma');
      expect(parsed.data.email).toBe('rahul.sharma@acmecorp.com');
      expect(parsed.data.phone).toBe('+91 98765-43210');
    }
  });

  it('should accept client without phone number and convert empty phone to null', () => {
    const raw = {
      name: 'Priya Patel',
      email: 'priya@studio.design',
      phone: '   ',
    };

    const parsed = clientSchema.safeParse(raw);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.phone).toBeNull();
    }
  });

  it('should reject names with control characters', () => {
    const raw = {
      name: 'Bad\u0000Name',
      email: 'bad@example.com',
    };
    const parsed = clientSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });

  it('should reject names shorter than 2 chars or longer than 100 chars', () => {
    expect(clientSchema.safeParse({ name: 'A', email: 'a@example.com' }).success).toBe(false);
    expect(
      clientSchema.safeParse({
        name: 'A'.repeat(101),
        email: 'a@example.com',
      }).success
    ).toBe(false);
  });

  it('should reject invalid email formats', () => {
    expect(clientSchema.safeParse({ name: 'Valid Name', email: 'not-an-email' }).success).toBe(false);
    expect(clientSchema.safeParse({ name: 'Valid Name', email: 'missing@domain' }).success).toBe(false);
    expect(clientSchema.safeParse({ name: 'Valid Name', email: '@domain.com' }).success).toBe(false);
  });

  it('should validate phone number format (7 to 15 digits)', () => {
    // Valid phone variations (digits, +, spaces and dashes only)
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '1234567' }).success).toBe(true);
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '+1-555-019-2834' }).success).toBe(true);
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '+91 98765 43210' }).success).toBe(true);

    // Invalid: letters in phone
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '+91 98abc123' }).success).toBe(false);

    // Invalid: too short (< 7 digits)
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '12345' }).success).toBe(false);

    // Invalid: too long (> 15 digits)
    expect(clientSchema.safeParse({ name: 'Client', email: 'c@example.com', phone: '1234567890123456' }).success).toBe(false);
  });

  it('should reject unknown fields (strict schema)', () => {
    const raw = {
      name: 'Valid Name',
      email: 'valid@example.com',
      user_id: 'malicious-user-id-override',
      injectedField: true,
    };
    const parsed = clientSchema.safeParse(raw);
    expect(parsed.success).toBe(false);
  });
});
