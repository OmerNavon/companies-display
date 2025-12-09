import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import {
  createNote,
  deleteNote,
  listNotesForCompany,
  updateNote,
} from "./store";

const NOTES_PATH = path.join(__dirname, "..", "data", "notes.json");
let originalContents = "[]";

beforeAll(async () => {
  try {
    originalContents = await fs.readFile(NOTES_PATH, "utf8");
  } catch {
    originalContents = "[]";
  }
  await fs.writeFile(NOTES_PATH, "[]", "utf8");
});

afterAll(async () => {
  await fs.writeFile(NOTES_PATH, originalContents, "utf8");
});

describe("store note lifecycle", () => {
  it("creates, updates, filters, and deletes notes", async () => {
    const author = "user-1";
    const otherUser = "user-2";

    const created = await createNote(
      { companyId: 1, content: "First note", isPrivate: true },
      author
    );

    expect(created.id).toBeTruthy();
    expect(created.isPrivate).toBe(true);

    let visibleToAuthor = await listNotesForCompany(1, author);
    expect(visibleToAuthor.find((n) => n.id === created.id)).toBeTruthy();

    let visibleToOther = await listNotesForCompany(1, otherUser);
    expect(visibleToOther.find((n) => n.id === created.id)).toBeUndefined();

    const updated = await updateNote(
      created.id,
      { content: "Updated", isPrivate: false },
      author
    );
    expect(updated.content).toBe("Updated");
    expect(updated.isPrivate).toBe(false);

    visibleToOther = await listNotesForCompany(1, otherUser);
    expect(visibleToOther.find((n) => n.id === created.id)).toBeTruthy();

    await deleteNote(created.id, author);
    visibleToAuthor = await listNotesForCompany(1, author);
    expect(visibleToAuthor.find((n) => n.id === created.id)).toBeUndefined();
  });
});
