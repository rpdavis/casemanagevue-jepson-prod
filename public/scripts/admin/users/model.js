// scripts/admin/users-model.js
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const db = getFirestore();

/**
 * Fetches one page of users from Firestore, with optional search.
 *
 * @param {Object}   opts
 * @param {"name"|"email"} opts.searchType
 * @param {string}   opts.searchTerm
 * @param {number}   opts.pageSize
 * @param {QueryDocumentSnapshot} [opts.cursor]  – last doc from previous page
 * @returns {Promise<{ users: any[], nextCursor: any|null }>}
 */
export async function fetchUsersPage({
  searchType = "name",
  searchTerm = "",
  pageSize = 20,
  cursor = null
}) {
  const usersRef = collection(db, "users");
  let q;

  // full‐scan name search (client side)
  if (searchTerm && searchType === "name") {
    const snapAll = await getDocs(query(usersRef, orderBy("name"), limit(1000)));
    const all = snapAll.docs.map(d => ({ id: d.id, ...d.data() }));
    const filtered = all.filter(u =>
      (u.name || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { users: filtered, nextCursor: null };
  }

  // email or empty search
  if (searchTerm && searchType === "email") {
    q = query(
      usersRef,
      orderBy("email"),
      where("email", ">=", searchTerm),
      where("email", "<=", searchTerm + "\uf8ff"),
      limit(pageSize)
    );
  } else if (!searchTerm) {
    q = query(usersRef, orderBy("name"), limit(pageSize));
  } else {
    q = query(
      usersRef,
      orderBy("name"),
      where("name", ">=", searchTerm),
      where("name", "<=", searchTerm + "\uf8ff"),
      limit(pageSize)
    );
  }

  // cursor‐based paging
  if (cursor) {
    q = query(
      usersRef,
      orderBy(searchType),
      startAfter(cursor),
      limit(pageSize)
    );
  }

  const snap = await getDocs(q);
  const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  const nextCursor = snap.docs.length === pageSize
    ? snap.docs[snap.docs.length - 1]
    : null;

  return { users, nextCursor };
}
