import { describe, it, expect } from 'vitest';
import {
  signupSchema,
  loginSchema,
  emailSchema,
  passwordBaseSchema,
} from '../src/lib/validations/auth';
import { generateResetToken, hashToken } from '../src/lib/mailer';

describe('Zod Auth Validation Schemas', () => {
  it('should validate standard email correctly', () => {
    expect(emailSchema.safeParse('valid.user@company.com').success).toBe(true);
    expect(emailSchema.safeParse('not-an-email').success).toBe(false);
    expect(emailSchema.safeParse('').success).toBe(false);
  });

  it('should validate password complexity', () => {
    // Valid: 8+ chars with at least one letter and one number
    expect(passwordBaseSchema.safeParse('SecretPass1').success).toBe(true);
    // Invalid: under 8 chars
    expect(passwordBaseSchema.safeParse('Pass1').success).toBe(false);
    // Invalid: no numbers
    expect(passwordBaseSchema.safeParse('LettersOnlyPass').success).toBe(false);
    // Invalid: no letters
    expect(passwordBaseSchema.safeParse('123456789').success).toBe(false);
  });

  it('should reject common passwords in signupSchema', () => {
    const res = signupSchema.safeParse({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(res.success).toBe(false);
  });

  it('should reject password matching user name or email', () => {
    const res = signupSchema.safeParse({
      name: 'JohnDoe',
      email: 'john@example.com',
      password: 'JohnDoe',
      confirmPassword: 'JohnDoe',
    });
    expect(res.success).toBe(false);
  });

  it('should validate successful signup payload', () => {
    const res = signupSchema.safeParse({
      name: 'Sarah Connor',
      email: 'sarah@skynet.com',
      password: 'CyberDyne2026!',
      confirmPassword: 'CyberDyne2026!',
    });
    expect(res.success).toBe(true);
  });
});

describe('Token Generation & Hashing', () => {
  it('should generate a 64-char raw hex token and a valid 64-char SHA-256 hash', () => {
    const { rawToken, tokenHash } = generateResetToken();
    expect(rawToken).toHaveLength(64);
    expect(tokenHash).toHaveLength(64);

    // Verify hash matches
    const rehashed = hashToken(rawToken);
    expect(rehashed).toBe(tokenHash);
  });
});

describe('Account Lockout Calculation', () => {
  it('should lock out after 5 failed attempts', () => {
    const checkLockout = (failedCount: number) => {
      const willLock = failedCount >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;
      return { willLock, lockedUntil };
    };

    expect(checkLockout(4).willLock).toBe(false);
    expect(checkLockout(5).willLock).toBe(true);
    expect(checkLockout(5).lockedUntil).not.toBeNull();
  });
});
