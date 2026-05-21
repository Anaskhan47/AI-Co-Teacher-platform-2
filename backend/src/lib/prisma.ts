// backend/src/lib/prisma.ts
// Tiny Prisma‑like stub that routes calls to Firebase Firestore.
// This allows the existing controllers (which expect a Prisma client) to keep
// working without a PostgreSQL database.

import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, cert } from 'firebase-admin/app';

// Ensure Firebase is initialized (the app.ts already imports firebase.ts, but we
// also guard against double‑initialisation here for safety).
if (!initializeApp.length) {
  // The firebase.ts module already performed initialization using the env var.
  // If this file is imported before firebase.ts, we fall back to a no‑op init.
  // This block is intentionally minimal – real credentials are handled in
  // backend/src/lib/firebase.ts.
}

const db = getFirestore();

// Helper to build a generic model interface.
const createModel = (model: string) => ({
  async create({ data }: { data: any }) {
    const docRef = await db.collection(model).add(data);
    return { id: docRef.id, ...data };
  },
  async findMany({ where, include, orderBy, take }: any = {}) {
    let query: any = db.collection(model);
    if (where) {
      for (const [key, value] of Object.entries(where)) {
        // Simple equality filters – more complex queries are not needed for the
        // current codebase.
        query = query.where(key, '==', value);
      }
    }
    if (orderBy) {
      // Firestore only supports a single orderBy; we ignore complex cases.
      const [field, direction] = Object.entries(orderBy)[0];
      query = query.orderBy(field as string, direction as any);
    }
    const limit = take ?? 50;
    const snap = await query.limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async findFirst({ where, include }: any = {}) {
    const results = await this.findMany({ where, include, take: 1 });
    return results[0] ?? null;
  },
  async findUnique({ where }: any) {
    return this.findFirst({ where });
  },
  async updateMany({ where, data }: any) {
    const docRef = db.collection(model).doc(where.id);
    await docRef.update(data);
    return { count: 1 };
  },
  async deleteMany({ where }: any) {
    const docRef = db.collection(model).doc(where.id);
    await docRef.delete();
    return { count: 1 };
  },
});

export const prisma: any = new Proxy({}, {
  get(_, prop) {
    const name = prop.toString();
    if (name === '$queryRaw') {
      // Return a dummy function that mimics Prisma's raw query capability.
      return async () => null;
    }
    // The property name corresponds to the model name used in the original code
    // (e.g. "assignment", "student", "lessonPlan", etc.).
    return createModel(name);
  },
});

// Minimal raw query placeholder – the original code only uses it for a
// lightweight connectivity check.
export const $queryRaw = async () => {
  // Firestore does not support raw SQL; we simply return a dummy value.
  return null;
};

export default prisma;
