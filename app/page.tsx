"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Snackbar } from "@mui/material";
import {
  GoogleAuthProvider,
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { Company, Note, CreateNoteInput, UpdateNoteInput } from "../../types";
import { getFirebaseAuth } from "@/lib/firebase";
import { Language, translations } from "./lib/translations";
import { HeroSection } from "./components/HeroSection";
import { AuthPreferencesCard } from "./components/AuthPreferencesCard";
import { FiltersBar } from "./components/FiltersBar";
import { CompanyCard } from "./components/CompanyCard";
import { Spinner, GoogleButton } from "./components/ui";

type NotesByCompany = Record<number, Note[]>;
type LoadingMap = Record<number, boolean>;
type SummaryState = Record<
  number,
  { text?: string; loading?: boolean; error?: string }
>;

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function Home() {
  const [language, setLanguage] = useState<Language>("he");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCompany, setExpandedCompany] = useState<number | null>(null);
  const [notesByCompany, setNotesByCompany] = useState<NotesByCompany>({});
  const [notesLoading, setNotesLoading] = useState<LoadingMap>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [privacyDrafts, setPrivacyDrafts] = useState<Record<number, boolean>>(
    {}
  );
  const [savingNotes, setSavingNotes] = useState<Record<string, boolean>>({});
  const [summaryState, setSummaryState] = useState<SummaryState>({});
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<string>("");
  const [editingPrivacy, setEditingPrivacy] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const copy = translations[language];
  const locale = language === "he" ? "he-IL" : undefined;
  const accentPalette = [
    "#7c3aed",
    "#f97316",
    "#0ea5e9",
    "#10b981",
    "#f43f5e",
    "#a855f7",
    "#f59e0b",
    "#14b8a6",
  ];

  const handleCloseError = (_event?: any, reason?: string) => {
    if (reason === "clickaway") return;
    setApiError(null);
  };

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user: User | null) => {
      setAuthUser(user);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("preferred-language");
    const preferred =
      stored === "en" || stored === "he"
        ? stored
        : navigator.language?.toLowerCase().startsWith("he")
        ? "he"
        : "en";
    setLanguage((prev) => (prev === preferred ? prev : preferred));
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "he" ? "he" : "en";
    document.documentElement.dir = language === "he" ? "rtl" : "ltr";
    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferred-language", language);
    }
  }, [language]);

  useEffect(() => {
    const fetchCompanies = async () => {
      setCompaniesLoading(true);
      try {
        if (authLoading || !authUser) return;
        const headers = await getAuthHeaders();
        const res = await fetch(`${apiBase}/companies`, { headers });
        if (!res.ok) {
          throw new Error(copy.errors.loadCompanies);
        }
        const data = (await res.json()) as { companies: Company[] };
        setApiError(null);
        setCompanies(data.companies);
        setCompaniesLoading(false);
      } catch (error: any) {
        setApiError(error.message || copy.errors.loadCompanies);
        setCompaniesLoading(false);
      }
    };
    fetchCompanies();
  }, [authLoading, authUser, copy.errors.loadCompanies]);

  const currentUserId = authUser?.uid || "dev-user";

  const getAuthHeaders = async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    try {
      if (authUser?.getIdToken) {
        const token = await authUser.getIdToken();
        headers.Authorization = `Bearer ${token}`;
      } else {
        headers["x-user-id"] = currentUserId;
      }
    } catch (error) {
      headers["x-user-id"] = currentUserId;
    }
    return headers;
  };

  const loadNotes = async (companyId: number) => {
    setNotesLoading((prev) => ({ ...prev, [companyId]: true }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${apiBase}/companies/${companyId}/notes`, {
        headers,
      });
      if (!res.ok) throw new Error(copy.errors.loadNotes);
      const data = (await res.json()) as { notes: Note[] };

      setNotesByCompany((prev) => ({ ...prev, [companyId]: data.notes }));
    } catch (error: any) {
      setApiError(error.message || copy.errors.loadNotes);
    } finally {
      setNotesLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const handleToggleNotes = (companyId: number) => {
    setExpandedCompany((prev) => (prev === companyId ? null : companyId));
    if (!notesByCompany[companyId]) {
      loadNotes(companyId);
    }
  };

  const handleCreateNote = async (companyId: number) => {
    const content = noteDrafts[companyId];
    if (!content?.trim()) return;
    const isPrivate = privacyDrafts[companyId] ?? false;

    setSavingNotes((prev) => ({ ...prev, [`new-${companyId}`]: true }));
    try {
      const headers = await getAuthHeaders();
      const payload: CreateNoteInput = { companyId, content, isPrivate };
      const res = await fetch(`${apiBase}/notes`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || copy.errors.createNote);
      setNotesByCompany((prev) => ({
        ...prev,
        [companyId]: [...(prev[companyId] || []), data.note as Note],
      }));
      setNoteDrafts((prev) => ({ ...prev, [companyId]: "" }));
    } catch (error: any) {
      setApiError(error.message || copy.errors.createNote);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [`new-${companyId}`]: false }));
    }
  };

  const startEditing = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingDraft(note.content);
    setEditingPrivacy(note.isPrivate ?? false);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingDraft("");
    setEditingPrivacy(false);
  };

  const handleUpdateNote = async (note: Note) => {
    if (!editingDraft.trim()) return;
    setSavingNotes((prev) => ({ ...prev, [note.id]: true }));
    try {
      const headers = await getAuthHeaders();
      const payload: UpdateNoteInput = {
        content: editingDraft,
        isPrivate: editingPrivacy,
      };
      const res = await fetch(`${apiBase}/notes/${note.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || copy.errors.updateNote);
      setNotesByCompany((prev) => {
        const list = prev[note.companyId] || [];
        return {
          ...prev,
          [note.companyId]: list.map((n) => (n.id === note.id ? data.note : n)),
        };
      });
      cancelEditing();
    } catch (error: any) {
      setApiError(error.message || copy.errors.updateNote);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [note.id]: false }));
    }
  };

  const handleDeleteNote = async (note: Note) => {
    setSavingNotes((prev) => ({ ...prev, [note.id]: true }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${apiBase}/notes/${note.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || copy.errors.deleteNote);
      }
      setNotesByCompany((prev) => {
        const list = prev[note.companyId] || [];
        return {
          ...prev,
          [note.companyId]: list.filter((n) => n.id !== note.id),
        };
      });
    } catch (error: any) {
      setApiError(error.message || copy.errors.deleteNote);
    } finally {
      setSavingNotes((prev) => ({ ...prev, [note.id]: false }));
    }
  };

  const handleSummarize = async (company: Company) => {
    setSummaryState((prev) => ({
      ...prev,
      [company.id]: { ...prev[company.id], loading: true, error: undefined },
    }));
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`${apiBase}/summaries`, {
        method: "POST",
        headers,
        body: JSON.stringify({ companyId: company.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || copy.errors.summarize);
      setSummaryState((prev) => ({
        ...prev,
        [company.id]: { text: data.summary, loading: false },
      }));
    } catch (error: any) {
      setSummaryState((prev) => ({
        ...prev,
        [company.id]: {
          loading: false,
          error: error.message || copy.errors.summarize,
        },
      }));
    }
  };

  const signInWithGoogleAuth = async () => {
    const auth = getFirebaseAuth();
    setApiError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error: any) {
      setApiError(error?.message || "Unable to sign in with Google");
    }
  };

  const handleSignOut = async () => {
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  const sectors = useMemo(
    () => Array.from(new Set(companies.map((c) => c.sector))),
    [companies]
  );

  const accentBySector = useMemo(() => {
    const map: Record<string, string> = {};
    sectors.forEach((sector, idx) => {
      map[sector] = accentPalette[idx % accentPalette.length];
    });
    return map;
  }, [sectors]);

  const filteredCompanies = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesSector = filter === "all" || c.sector === filter;
      const matchesSearch =
        !query ||
        c.name.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query);
      return matchesSector && matchesSearch;
    });
  }, [companies, filter, searchTerm]);

  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!authUser) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="card max-w-md w-full p-6 flex flex-col gap-4 text-center">
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {copy.badge}
          </div>
          <h1 className="text-2xl font-bold text-[#0b1b29]">
            {copy.heroTitle}
          </h1>
          <p className="text-sm text-slate-600 leading-6">
            {copy.heroSubtitle}
          </p>
          <GoogleButton onClick={signInWithGoogleAuth} disabled={authLoading}>
            {copy.signInWithGoogle}
          </GoogleButton>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-2">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="order-2 sm:order-1 w-full">
              <HeroSection
                copy={copy}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </div>
            <div className="order-1 sm:order-2 w-full sm:w-auto">
              <AuthPreferencesCard
                authUser={authUser}
                authLoading={authLoading}
                copy={copy}
                language={language}
                onLanguageChange={setLanguage}
                onSignInWithGoogle={signInWithGoogleAuth}
                onSignOut={handleSignOut}
              />
            </div>
          </header>

          <FiltersBar
            sectors={sectors}
            filter={filter}
            onFilterChange={setFilter}
            count={filteredCompanies.length}
            copy={copy}
          />
          {companiesLoading ? (
            <div className="card p-6 text-slate-600 flex items-center gap-3">
              <Spinner /> {copy.loadingCompanies}
            </div>
          ) : (
            <div
              className="grid gap-5 md:grid-cols-2"
              style={{ alignItems: "start" }}
            >
              {filteredCompanies.map((company) => {
                const summary = summaryState[company.id];
                const isExpanded = expandedCompany === company.id;
                const isLoadingNotes = notesLoading[company.id];
                const accent =
                  accentBySector[company.sector] ||
                  accentPalette[company.id % accentPalette.length];
                const notes = notesByCompany[company.id] || [];
                const noteDraft = noteDrafts[company.id] || "";
                const privacyDraft = privacyDrafts[company.id] ?? false;
                return (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    accent={accent}
                    copy={copy}
                    summary={summary}
                    isExpanded={isExpanded}
                    isLoadingNotes={isLoadingNotes}
                    notes={notes}
                    currentUserId={currentUserId}
                    locale={locale}
                    editingNoteId={editingNoteId}
                    editingDraft={editingDraft}
                    editingPrivacy={editingPrivacy}
                    savingNotes={savingNotes}
                    noteDraft={noteDraft}
                    privacyDraft={privacyDraft}
                    onToggleNotes={() => handleToggleNotes(company.id)}
                    onSummarize={() => handleSummarize(company)}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onEditingDraftChange={setEditingDraft}
                    onEditingPrivacyChange={setEditingPrivacy}
                    onUpdateNote={handleUpdateNote}
                    onDeleteNote={handleDeleteNote}
                    onDraftChange={(value) =>
                      setNoteDrafts((prev) => ({
                        ...prev,
                        [company.id]: value,
                      }))
                    }
                    onPrivacyDraftChange={(value) =>
                      setPrivacyDrafts((prev) => ({
                        ...prev,
                        [company.id]: value,
                      }))
                    }
                    onCreateNote={() => handleCreateNote(company.id)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Snackbar
        open={!!apiError}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseError}
          severity="error"
          sx={{ width: "100%", borderRadius: "9999px" }}
          variant="filled"
        >
          {apiError}
        </Alert>
      </Snackbar>
    </>
  );
}
