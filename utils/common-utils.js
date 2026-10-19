import { randomUUID } from 'node:crypto';

/**
 * Generate a unique email address for a disposable test account.
 *
 * @param {string} [prefix='playwright.test'] Prefix for the email local part.
 * @returns {string} Unique email address under the reserved example.com domain.
 */
export function createUniqueEmail(prefix = 'playwright.test') {
  return `${prefix}.${randomUUID()}@example.com`;
}
