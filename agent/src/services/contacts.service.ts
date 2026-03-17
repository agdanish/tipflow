import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import type { Contact, ChainId } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTACTS_FILE = join(__dirname, '..', '..', '.contacts.json');

/**
 * ContactsService — in-memory address book with JSON file persistence.
 */
export class ContactsService {
  private contacts: Map<string, Contact> = new Map();

  constructor() {
    this.load();
  }

  /** Add a new contact */
  addContact(name: string, address: string, chain?: ChainId): Contact {
    // Check for duplicate address
    for (const c of this.contacts.values()) {
      if (c.address.toLowerCase() === address.toLowerCase()) {
        // Update existing contact name if different
        c.name = name;
        if (chain) c.chain = chain;
        this.save();
        return c;
      }
    }

    const contact: Contact = {
      id: uuidv4(),
      name,
      address,
      chain,
      tipCount: 0,
    };

    this.contacts.set(contact.id, contact);
    this.save();
    logger.info('Contact added', { id: contact.id, name, address });
    return contact;
  }

  /** Get all contacts sorted by tipCount descending */
  getContacts(): Contact[] {
    return Array.from(this.contacts.values()).sort((a, b) => b.tipCount - a.tipCount);
  }

  /** Delete a contact by ID */
  deleteContact(id: string): boolean {
    const deleted = this.contacts.delete(id);
    if (deleted) {
      this.save();
      logger.info('Contact deleted', { id });
    }
    return deleted;
  }

  /** Increment tip count for an address (called after successful tip) */
  incrementTipCount(address: string): void {
    for (const c of this.contacts.values()) {
      if (c.address.toLowerCase() === address.toLowerCase()) {
        c.tipCount++;
        c.lastTipped = new Date().toISOString();
        this.save();
        return;
      }
    }
  }

  /** Load contacts from disk */
  private load(): void {
    try {
      if (existsSync(CONTACTS_FILE)) {
        const data = JSON.parse(readFileSync(CONTACTS_FILE, 'utf-8')) as Contact[];
        for (const c of data) {
          this.contacts.set(c.id, c);
        }
        logger.info(`Loaded ${this.contacts.size} contacts from disk`);
      }
    } catch (err) {
      logger.warn('Failed to load contacts file', { error: String(err) });
    }
  }

  /** Persist contacts to disk */
  private save(): void {
    try {
      const data = Array.from(this.contacts.values());
      writeFileSync(CONTACTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      logger.warn('Failed to save contacts file', { error: String(err) });
    }
  }
}
