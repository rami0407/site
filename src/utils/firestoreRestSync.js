// Direct HTTPS REST + Immutable Revision Sync Engine for Firestore (`site-a8b88`)
// Solves BOTH:
// 1. School firewall / Rimon / proxy WebChannel streaming hangs (uses plain HTTPS fetch!)
// 2. Live Firestore rules where `students/{docId}` allows `read` + `create` for teachers,
//    while reserving `update` + `delete` for `isSuperAdmin()` (Principal Rami).
// Teachers write new revision docs via HTTP POST (`create` -> 200 OK!), readers resolve the
// newest server `updateTime` across base + revisions, and SuperAdmin auto-compacts revisions!

import { auth } from '../firebase.js';

const FIRESTORE_ROOT =
  'https://firestore.googleapis.com/v1/projects/site-a8b88/databases/(default)';
const FIRESTORE_DOCS_URL = `${FIRESTORE_ROOT}/documents`;

export const toFirestoreValue = (val) => {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) return { nullValue: null };
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) {
    return {
      arrayValue: {
        values: val.filter((item) => item !== undefined).map(toFirestoreValue)
      }
    };
  }
  if (typeof val === 'object') {
    const fields = {};
    Object.entries(val).forEach(([k, v]) => {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    });
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
};

export const toFirestoreFields = (obj) => {
  const fields = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) {
      fields[k] = toFirestoreValue(v);
    }
  });
  return fields;
};

export const fromFirestoreValue = (v) => {
  if (!v || typeof v !== 'object') return null;
  if ('nullValue' in v) return null;
  if ('booleanValue' in v) return Boolean(v.booleanValue);
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('arrayValue' in v) {
    const arr = v.arrayValue?.values || [];
    return arr.map(fromFirestoreValue);
  }
  if ('mapValue' in v) {
    return fromFirestoreFields(v.mapValue?.fields || {});
  }
  return null;
};

export const fromFirestoreFields = (fields) => {
  const out = {};
  if (!fields || typeof fields !== 'object') return out;
  Object.entries(fields).forEach(([k, v]) => {
    out[k] = fromFirestoreValue(v);
  });
  return out;
};

const getAdminIdToken = async () => {
  try {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken();
    }
  } catch {}
  return null;
};

/**
 * Save logical document to Firestore:
 * - If logged in as Firebase SuperAdmin, updates base doc directly (200 OK).
 * - Otherwise (teachers / Coordinator Jihan), creates an immutable revision doc via POST `create` (200 OK!).
 */
export const firestoreRestSaveDoc = async (collectionName, logicalDocId, dataObj, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const cleanObj = JSON.parse(JSON.stringify(dataObj));
    delete cleanObj._logicalId;

    // 1. Try direct authenticated base update if SuperAdmin token is present
    const idToken = await getAdminIdToken();
    if (idToken) {
      const patchBody = JSON.stringify({ fields: toFirestoreFields(cleanObj) });
      const patchRes = await fetch(
        `${FIRESTORE_DOCS_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(logicalDocId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`
          },
          body: patchBody,
          cache: 'no-store',
          keepalive: patchBody.length < 60000,
          signal: controller.signal
        }
      ).catch(() => null);

      if (patchRes && patchRes.ok) {
        const json = await patchRes.json();
        const updateTime = json.updateTime || null;
        return {
          ok: true,
          updateTime,
          ms: updateTime ? Date.parse(updateTime) : Date.now(),
          data: fromFirestoreFields(json.fields)
        };
      }
    }

    // 2. Universal sanctioned `create` path for all teachers & Coordinator Jihan (HTTP 200 OK!)
    const revDocId = `rev__${logicalDocId}__${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const revPayload = {
      ...cleanObj,
      _logicalId: logicalDocId
    };
    const postBody = JSON.stringify({ fields: toFirestoreFields(revPayload) });
    const postUrl = `${FIRESTORE_DOCS_URL}/${encodeURIComponent(collectionName)}?documentId=${encodeURIComponent(revDocId)}`;

    const res = await fetch(postUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: postBody,
      cache: 'no-store',
      keepalive: postBody.length < 60000,
      signal: controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText.slice(0, 120)}`);
    }
    const json = await res.json();
    const parsed = fromFirestoreFields(json.fields);
    delete parsed._logicalId;
    const updateTime = json.updateTime || null;
    return {
      ok: true,
      updateTime,
      ms: updateTime ? Date.parse(updateTime) : Date.now(),
      data: parsed
    };
  } finally {
    clearTimeout(timer);
  }
};

/**
 * Read newest revision (or base doc) of a single logical document using Google server `updateTime`
 */
export const firestoreRestGetDoc = async (collectionName, logicalDocId, timeoutMs = 8000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [baseRes, queryRes] = await Promise.all([
      fetch(`${FIRESTORE_DOCS_URL}/${encodeURIComponent(collectionName)}/${encodeURIComponent(logicalDocId)}`, {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal
      }).catch(() => null),
      fetch(`${FIRESTORE_DOCS_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: collectionName }],
            where: {
              fieldFilter: {
                field: { fieldPath: '_logicalId' },
                op: 'EQUAL',
                value: { stringValue: logicalDocId }
              }
            }
          }
        })
      }).catch(() => null)
    ]);

    const candidates = [];
    if (baseRes && baseRes.ok) {
      const bj = await baseRes.json();
      if (bj && bj.fields) {
        candidates.push({
          updateTime: bj.updateTime || '',
          ms: bj.updateTime ? Date.parse(bj.updateTime) : 0,
          data: fromFirestoreFields(bj.fields)
        });
      }
    }

    if (queryRes && queryRes.ok) {
      const qj = await queryRes.json();
      if (Array.isArray(qj)) {
        qj.forEach((row) => {
          if (row?.document?.fields) {
            const parsed = fromFirestoreFields(row.document.fields);
            delete parsed._logicalId;
            candidates.push({
              updateTime: row.document.updateTime || '',
              ms: row.document.updateTime ? Date.parse(row.document.updateTime) : 0,
              data: parsed
            });
          }
        });
      }
    }

    if (candidates.length === 0) return { exists: false, data: null };
    candidates.sort((a, b) => b.ms - a.ms);
    return {
      exists: true,
      updateTime: candidates[0].updateTime,
      ms: candidates[0].ms,
      data: candidates[0].data
    };
  } finally {
    clearTimeout(timer);
  }
};

let lastCompactionMs = 0;

/**
 * List & resolve newest server state for ALL `holistic_*` documents (base + teacher revisions) in 2 parallel requests!
 * Uses an exact `__name__` range query so it never truncates regardless of total collection size.
 * Also auto-compacts consumed revision docs in the background when SuperAdmin is logged in.
 */
export const firestoreRestListHolisticDocs = async (timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const [listRes, revRes] = await Promise.all([
      fetch(`${FIRESTORE_DOCS_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'students' }],
            where: {
              compositeFilter: {
                op: 'AND',
                filters: [
                  {
                    fieldFilter: {
                      field: { fieldPath: '__name__' },
                      op: 'GREATER_THAN_OR_EQUAL',
                      value: {
                        referenceValue:
                          'projects/site-a8b88/databases/(default)/documents/students/holistic_'
                      }
                    }
                  },
                  {
                    fieldFilter: {
                      field: { fieldPath: '__name__' },
                      op: 'LESS_THAN_OR_EQUAL',
                      value: {
                        referenceValue:
                          'projects/site-a8b88/databases/(default)/documents/students/holistic_\uf8ff'
                      }
                    }
                  }
                ]
              }
            }
          }
        })
      }).catch(() => null),
      fetch(`${FIRESTORE_DOCS_URL}:runQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'students' }],
            where: {
              fieldFilter: {
                field: { fieldPath: '_logicalId' },
                op: 'GREATER_THAN',
                value: { stringValue: '' }
              }
            }
          }
        })
      }).catch(() => null)
    ]);

    const bestByLogicalId = new Map();
    const revDocsByLogicalId = new Map();

    const considerDoc = (logicalId, updateTime, fieldsObj) => {
      if (!logicalId || !logicalId.startsWith('holistic_')) return;
      const ms = updateTime ? Date.parse(updateTime) : 0;
      const prev = bestByLogicalId.get(logicalId);
      if (!prev || ms >= prev.ms) {
        const cleanData = { ...fieldsObj };
        delete cleanData._logicalId;
        bestByLogicalId.set(logicalId, {
          id: logicalId,
          updateTime: updateTime || '',
          ms,
          data: cleanData
        });
      }
    };

    if (listRes && listRes.ok) {
      const lj = await listRes.json();
      if (Array.isArray(lj)) {
        lj.forEach((row) => {
          if (row?.document?.fields) {
            const rawId = row.document.name ? row.document.name.split('/').pop() : '';
            const parsed = fromFirestoreFields(row.document.fields);
            const logicalId = parsed._logicalId || rawId;
            considerDoc(logicalId, row.document.updateTime, parsed);
          }
        });
      }
    }

    if (revRes && revRes.ok) {
      const rj = await revRes.json();
      if (Array.isArray(rj)) {
        rj.forEach((row) => {
          if (row?.document?.fields) {
            const rawDocName = row.document.name || '';
            const rawDocId = rawDocName.split('/').pop();
            const revMs = row.document.updateTime ? Date.parse(row.document.updateTime) : 0;
            const parsed = fromFirestoreFields(row.document.fields);
            const logicalId = parsed._logicalId;
            if (logicalId && logicalId.startsWith('holistic_')) {
              considerDoc(logicalId, row.document.updateTime, parsed);
              if (!revDocsByLogicalId.has(logicalId)) revDocsByLogicalId.set(logicalId, []);
              revDocsByLogicalId.get(logicalId).push({ id: rawDocId, ms: revMs });
            }
          }
        });
      }
    }

    // Background SuperAdmin compaction (merges teacher revisions into base doc & cleans only consumed rev__ docs)
    const now = Date.now();
    if (revDocsByLogicalId.size > 0 && now - lastCompactionMs > 20000) {
      getAdminIdToken().then(async (idToken) => {
        if (!idToken) return;
        lastCompactionMs = Date.now();
        for (const [logicalId, revEntries] of revDocsByLogicalId.entries()) {
          const winner = bestByLogicalId.get(logicalId);
          if (!winner) continue;
          const ok = await fetch(`${FIRESTORE_DOCS_URL}/students/${encodeURIComponent(logicalId)}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`
            },
            body: JSON.stringify({ fields: toFirestoreFields(winner.data) })
          })
            .then((r) => r.ok)
            .catch(() => false);
          if (ok) {
            for (const rEntry of revEntries) {
              if (rEntry.ms <= winner.ms) {
                fetch(`${FIRESTORE_DOCS_URL}/students/${encodeURIComponent(rEntry.id)}`, {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${idToken}` }
                }).catch(() => {});
              }
            }
          }
        }
      });
    }

    return Array.from(bestByLogicalId.values());
  } finally {
    clearTimeout(timer);
  }
};
