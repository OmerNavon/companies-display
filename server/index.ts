import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import OpenAI from "openai";
import admin from "firebase-admin";
import path from "path";
import {
  createNote,
  deleteNote,
  getCompanies,
  getCompanyById,
  listNotesForCompany,
  updateNote,
} from "./store";
import { CreateNoteInput, UpdateNoteInput } from "../../types";

type AuthedRequest<B = any, P = Record<string, string>> = Request<P, any, B> & {
  userId?: string;
};

const PORT = Number(process.env.PORT) || 4000;
const DEFAULT_ORIGIN = process.env.CORS_ORIGIN?.split(",") ?? [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (serviceAccountJson && !admin.apps.length) {
  const creds = JSON.parse(serviceAccountJson);
  admin.initializeApp({
    credential: admin.credential.cert(creds as admin.ServiceAccount),
  });
}

async function attachUserIfPresent(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.get("authorization");
  const devBypass =
    process.env.ALLOW_DEV_AUTH_BYPASS === "true" ||
    (!admin.apps.length && process.env.NODE_ENV !== "production");

  if (authHeader?.startsWith("Bearer ") && admin.apps.length) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      req.userId = decoded.uid;
      return next();
    } catch (error) {
      if (!devBypass) {
        return res.status(401).json({ error: "Invalid token" });
      }
    }
  }

  if (devBypass) {
    req.userId = req.get("x-user-id") || "dev-user";
  }

  return next();
}

function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  return next();
}

const app = express();
app.use(cors({ origin: DEFAULT_ORIGIN, credentials: true }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.get(
  "/companies",
  attachUserIfPresent,
  requireUser,
  async (_req: AuthedRequest, res: Response) => {
    const companies = await getCompanies();
    res.json({ companies });
  }
);

app.get(
  "/companies/:id/notes",
  attachUserIfPresent,
  async (req: AuthedRequest<any, { id: string }>, res: Response) => {
    const companyId = Number(req.params.id);
    if (Number.isNaN(companyId)) {
      return res.status(400).json({ error: "Invalid company id" });
    }

    const notes = await listNotesForCompany(companyId, req.userId);
    res.json({ notes });
  }
);

app.post(
  "/notes",
  attachUserIfPresent,
  requireUser,
  async (req: AuthedRequest<CreateNoteInput>, res: Response) => {
    const payload = req.body;
    if (!payload?.content || !payload?.companyId) {
      return res
        .status(400)
        .json({ error: "companyId and content are required" });
    }

    try {
      const note = await createNote(payload, req.userId);
      res.status(201).json({ note });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Unable to create note" });
    }
  }
);

app.put(
  "/notes/:id",
  attachUserIfPresent,
  requireUser,
  async (
    req: AuthedRequest<UpdateNoteInput, { id: string }>,
    res: Response
  ) => {
    const noteId = req.params.id;
    const updates = req.body;
    if (!updates?.content) {
      return res.status(400).json({ error: "content is required" });
    }

    try {
      const updated = await updateNote(noteId, updates, req.userId);
      res.json({ note: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Unable to update note" });
    }
  }
);

app.delete(
  "/notes/:id",
  attachUserIfPresent,
  requireUser,
  async (req: AuthedRequest<any, { id: string }>, res: Response) => {
    const noteId = req.params.id;
    try {
      await deleteNote(noteId, req.userId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Unable to delete note" });
    }
  }
);

app.post(
  "/summaries",
  attachUserIfPresent,
  async (req: AuthedRequest<{ companyId: number }>, res: Response) => {
    const companyId = Number(req.body?.companyId);
    if (!Number.isInteger(companyId)) {
      return res.status(400).json({ error: "companyId is required" });
    }

    const company = await getCompanyById(companyId);
    if (!company) {
      return res.status(404).json({ error: "Company not found" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    }

    try {
      const prompt = `Create a concise 2-3 sentence overview for ${company.name}. Description: ${company.description}. Sector: ${company.sector}. Audience: product and GTM leaders.`;
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You write crisp, neutral company summaries.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 200,
      });

      const summary = completion.choices[0]?.message?.content ?? "";
      res.json({ companyId, summary });
    } catch (error: any) {
      console.error("OpenAI error", error);
      res.status(500).json({ error: "Failed to generate summary" });
    }
  }
);

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Unexpected server error" });
});

app.listen(PORT, () => {
  const dataDir = path.join(__dirname, "..", "data");
  console.log(
    `API server listening on port ${PORT}. Data directory: ${dataDir}`
  );
});
