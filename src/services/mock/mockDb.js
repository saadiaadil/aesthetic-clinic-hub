import { appointments } from '@/data/appointments';
import { clinicServices } from '@/data/clinicServices';
import { clinics } from '@/data/clinics';
import { doctorLeaves, doctorSchedules, doctors } from '@/data/doctors';
import { notifications } from '@/data/notifications';
import { reviews } from '@/data/reviews';
import { specialties, treatments } from '@/data/treatments';
import { users } from '@/data/users';
import { addDays, todayKey } from '@/utils/date';

/**
 * In-browser mock database used only while USE_MOCK_API is true.
 *
 * Seed data is copied into mutable tables and persisted to localStorage so
 * bookings, reviews and admin actions survive a page reload. The store
 * re-seeds each day (so relative "today" dates stay meaningful) or when
 * DB_VERSION changes. This is replaced wholesale by MongoDB in Phase 5.
 */

const STORAGE_KEY = 'ach.mockdb';
const DB_VERSION = 4;

function createSeed() {
  const today = todayKey();
  return {
    users: users.map((user) => ({ ...user })),
    clinics,
    clinicServices,
    doctors,
    doctorSchedules,
    doctorLeaves: doctorLeaves.map(({ startOffsetDays, endOffsetDays, ...leave }) => ({
      ...leave,
      startDate: addDays(today, startOffsetDays),
      endDate: addDays(today, endOffsetDays),
    })),
    specialties,
    treatments,
    appointments,
    reviews,
    notifications,
  };
}

function load() {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.version === DB_VERSION && parsed.seededOn === today) return parsed.tables;
    }
  } catch {
    // Corrupt or unavailable storage: fall back to a fresh seed.
  }
  return JSON.parse(JSON.stringify(createSeed()));
}

let tables = load();

function persist() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: DB_VERSION, seededOn: todayKey(), tables }),
    );
  } catch {
    // Storage full or disabled — keep working in memory.
  }
}

export const db = {
  all(table) {
    return tables[table];
  },
  find(table, id) {
    return tables[table].find((row) => row.id === id) ?? null;
  },
  where(table, predicate) {
    return tables[table].filter(predicate);
  },
  insert(table, record) {
    tables[table] = [record, ...tables[table]];
    persist();
    return record;
  },
  update(table, id, patch) {
    let updated = null;
    tables[table] = tables[table].map((row) => {
      if (row.id !== id) return row;
      updated = { ...row, ...patch, updatedAt: new Date().toISOString() };
      return updated;
    });
    persist();
    return updated;
  },
  replaceWhere(table, predicate, rows) {
    tables[table] = [...tables[table].filter((row) => !predicate(row)), ...rows];
    persist();
  },
  remove(table, id) {
    tables[table] = tables[table].filter((row) => row.id !== id);
    persist();
  },
  reset() {
    tables = JSON.parse(JSON.stringify(createSeed()));
    persist();
  },
};

// Handy while demoing: run `__resetMockData()` in the browser console.
if (typeof window !== 'undefined') {
  window.__resetMockData = () => {
    db.reset();
    window.location.reload();
  };
}
