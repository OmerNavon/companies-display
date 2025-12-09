import fs from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";
import admin from "firebase-admin";
import { Company, Note, CreateNoteInput, UpdateNoteInput } from "../../types";

const ROOT_DIR = path.join(__dirname, "..", "..");
const NOTES_PATH = path.join(ROOT_DIR, "data", "notes.json");

function hasFirestore() {
  return !!process.env.FIREBASE_SERVICE_ACCOUNT && admin.apps.length > 0;
}

function notesCollection() {
  if (!hasFirestore()) {
    throw new Error("Firestore not configured");
  }
  return admin.firestore().collection("notes");
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch (error: any) {
    if (error.code === "ENOENT") {
      await writeJsonFile(filePath, fallback);
      return fallback;
    }
    throw error;
  }
}

async function writeJsonFile<T>(filePath: string, data: T) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

function companiesCollection() {
  if (!hasFirestore()) {
    throw new Error("Firestore not configured");
  }
  return admin.firestore().collection("companies");
}

export async function getCompanies(): Promise<Company[]> {
  if (!hasFirestore()) {
    throw new Error("Firestore not configured for companies");
  }

  const snap = await companiesCollection().get();
  return snap.docs.map((d) => {
    const data = d.data() as Company;
    return {
      ...data,
      id: typeof data.id === "number" ? data.id : Number(data.id ?? d.id),
    } as Company;
  });
}

export async function getCompanyById(id: number): Promise<Company | undefined> {
  if (!hasFirestore()) {
    throw new Error("Firestore not configured for companies");
  }

  const snap = await companiesCollection().where("id", "==", id).limit(1).get();
  const doc = snap.docs[0];
  if (!doc) return undefined;
  const data = doc.data() as Company;
  return {
    ...data,
    id: typeof data.id === "number" ? data.id : Number(data.id ?? doc.id),
  } as Company;
}

async function loadNotes(): Promise<Note[]> {
  if (hasFirestore()) {
    const snap = await notesCollection().get();
    return snap.docs.map((d) => d.data() as Note);
  }
  return readJsonFile<Note[]>(NOTES_PATH, []);
}

async function saveNotes(notes: Note[]): Promise<void> {
  if (hasFirestore()) {
    const batch = admin.firestore().batch();
    const col = notesCollection();

    notes.forEach((note) => {
      const ref = col.doc(note.id);
      batch.set(ref, note, { merge: true });
    });
    await batch.commit();
    return;
  }
  await writeJsonFile(NOTES_PATH, notes);
}

export async function listNotesForCompany(
  companyId: number,
  userId?: string
): Promise<Note[]> {
  if (hasFirestore()) {
    const snap = await notesCollection()
      .where("companyId", "==", companyId)
      .get();
    const notes = snap.docs.map((d) => d.data() as Note);
    return notes.filter((note) => {
      if (note.isPrivate) {
        return note.userId && userId && note.userId === userId;
      }
      return true;
    });
  }

  const notes = await loadNotes();
  return notes.filter((note) => {
    if (note.companyId !== companyId) return false;
    if (note.isPrivate && note.userId && userId) return note.userId === userId;
    return !note.isPrivate;
  });
}

export async function createNote(
  input: CreateNoteInput,
  userId?: string
): Promise<Note> {
  if (!userId) {
    throw new Error("User is not authenticated.");
  }

  const now = new Date().toISOString();
  const newNote: Note = {
    id: uuid(),
    companyId: input.companyId,
    content: input.content,
    isPrivate: input.isPrivate ?? false,
    userId,
    createdAt: now,
  };

  if (hasFirestore()) {
    await notesCollection().doc(newNote.id).set(newNote);
    return newNote;
  }

  const notes = await loadNotes();
  notes.push(newNote);
  await saveNotes(notes);
  return newNote;
}

export async function updateNote(
  noteId: string,
  updates: UpdateNoteInput,
  userId?: string
): Promise<Note> {
  if (hasFirestore()) {
    const ref = notesCollection().doc(noteId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Note not found");
    const existing = snap.data() as Note;
    if (!userId || existing.userId !== userId) {
      throw new Error("Not authorized to edit this note");
    }
    const updated: Note = {
      ...existing,
      content: updates.content ?? existing.content,
      isPrivate: updates.isPrivate ?? existing.isPrivate,
    };
    await ref.set(updated, { merge: true });
    return updated;
  }

  const notes = await loadNotes();
  const index = notes.findIndex((note) => note.id === noteId);

  if (index === -1) {
    throw new Error("Note not found");
  }

  const existing = notes[index];
  if (!userId || existing.userId !== userId) {
    throw new Error("Not authorized to edit this note");
  }

  const updated: Note = {
    ...existing,
    content: updates.content ?? existing.content,
    isPrivate: updates.isPrivate ?? existing.isPrivate,
  };

  notes[index] = updated;
  await saveNotes(notes);
  return updated;
}

export async function deleteNote(
  noteId: string,
  userId?: string
): Promise<void> {
  if (hasFirestore()) {
    const ref = notesCollection().doc(noteId);
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Note not found");
    const existing = snap.data() as Note;
    if (!userId || existing.userId !== userId) {
      throw new Error("Not authorized to delete this note");
    }
    await ref.delete();
    return;
  }

  const notes = await loadNotes();
  const existing = notes.find((n) => n.id === noteId);

  if (!existing) {
    throw new Error("Note not found");
  }

  if (!userId || existing.userId !== userId) {
    throw new Error("Not authorized to delete this note");
  }

  const filtered = notes.filter((note) => note.id !== noteId);
  await saveNotes(filtered);
}
