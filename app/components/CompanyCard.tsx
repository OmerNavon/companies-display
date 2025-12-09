"use client";

import { Card, CardContent, Chip } from "@mui/material";
import { FiLink } from "react-icons/fi";
import { Company, Note } from "../../../types";
import { Translation } from "../types/ui";
import { GhostButton, PrimaryButton, SecondaryButton, Spinner } from "./ui";

type SummaryEntry = { text?: string; loading?: boolean; error?: string };

type CompanyCardProps = {
  company: Company;
  accent: string;
  copy: Translation;
  summary?: SummaryEntry;
  isExpanded: boolean;
  isLoadingNotes: boolean;
  notes: Note[];
  currentUserId: string;
  locale?: string;
  editingNoteId: string | null;
  editingDraft: string;
  editingPrivacy: boolean;
  savingNotes: Record<string, boolean>;
  noteDraft: string;
  privacyDraft: boolean;
  onToggleNotes: () => void;
  onSummarize: () => void;
  onStartEditing: (note: Note) => void;
  onCancelEditing: () => void;
  onEditingDraftChange: (value: string) => void;
  onEditingPrivacyChange: (value: boolean) => void;
  onUpdateNote: (note: Note) => void;
  onDeleteNote: (note: Note) => void;
  onDraftChange: (value: string) => void;
  onPrivacyDraftChange: (value: boolean) => void;
  onCreateNote: () => void;
};

export function CompanyCard({
  company,
  accent,
  copy,
  summary,
  isExpanded,
  isLoadingNotes,
  notes,
  currentUserId,
  locale,
  editingNoteId,
  editingDraft,
  editingPrivacy,
  savingNotes,
  noteDraft,
  privacyDraft,
  onToggleNotes,
  onSummarize,
  onStartEditing,
  onCancelEditing,
  onEditingDraftChange,
  onEditingPrivacyChange,
  onUpdateNote,
  onDeleteNote,
  onDraftChange,
  onPrivacyDraftChange,
  onCreateNote,
}: CompanyCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: "18px",
        borderColor: accent,
        boxShadow: `0 18px 45px -28px ${accent}70`,
      }}
    >
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.08em] text-slate-500">
              <Chip
                label={company.sector}
                variant="outlined"
                sx={{
                  borderColor: accent,
                  color: accent,
                  backgroundColor: "#fff",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                }}
              />
            </div>
            <h2 className="text-xl font-semibold text-[#0b1b29]">
              {company.name}
            </h2>
            <p className="text-sm text-slate-600 leading-6">
              {company.description}
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="pill">
                {company.employees} {copy.employeesLabel}
              </span>
            </div>
          </div>
          <GhostButton
            startIcon={<FiLink aria-hidden="true" size={16} />}
            onClick={() => window.open(company.website, "_blank")}
            sx={{ gap: 1 }}
          >
            {copy.website}
          </GhostButton>
        </div>

        <div className="flex flex-wrap gap-2">
          <GhostButton onClick={onToggleNotes} disabled={isLoadingNotes}>
            {isLoadingNotes ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> {copy.loadingNotesButton}
              </span>
            ) : isExpanded ? (
              copy.hideNotes
            ) : (
              copy.viewNotes
            )}
          </GhostButton>
          <PrimaryButton onClick={onSummarize} disabled={summary?.loading}>
            {summary?.loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner /> {copy.describing}
              </span>
            ) : (
              copy.description
            )}
          </PrimaryButton>
        </div>

        {summary?.text && (
          <div className="glass-panel text-sm text-[#0b1b29] leading-6">
            <div
              className="text-xs uppercase tracking-[0.18em] mb-2"
              style={{ color: accent }}
            >
              {copy.aiDescription}
            </div>
            {summary.text}
          </div>
        )}
        {summary?.error && (
          <div className="text-sm text-red-300">
            {summary.error || copy.descriptionError}
          </div>
        )}

        {isExpanded && (
          <div className="mt-4 space-y-3">
            <div className="divider" />

            {!isLoadingNotes && notes.length === 0 && (
              <p className="text-sm text-slate-500">{copy.noNotes}</p>
            )}
            {notes.map((note) => {
              const isOwner = !note.userId || note.userId === currentUserId;
              const isEditing = editingNoteId === note.id;
              return (
                <div key={note.id} className="glass-panel space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="pill">
                        {note.isPrivate ? copy.private : copy.public}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(note.createdAt).toLocaleString(locale)}
                      </span>
                    </div>
                    {isOwner && (
                      <div className="flex gap-2">
                        {isEditing ? (
                          <PrimaryButton
                            onClick={() => onUpdateNote(note)}
                            disabled={savingNotes[note.id]}
                          >
                            {savingNotes[note.id] ? (
                              <span className="inline-flex items-center gap-2">
                                <Spinner /> {copy.saving}
                              </span>
                            ) : (
                              copy.save
                            )}
                          </PrimaryButton>
                        ) : (
                          <GhostButton onClick={() => onStartEditing(note)}>
                            {copy.edit}
                          </GhostButton>
                        )}
                        <GhostButton
                          onClick={() => onDeleteNote(note)}
                          disabled={savingNotes[note.id]}
                        >
                          {savingNotes[note.id] ? (
                            <span className="inline-flex items-center gap-2">
                              <Spinner /> {copy.deleting}
                            </span>
                          ) : (
                            copy.delete
                          )}
                        </GhostButton>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        className="input"
                        rows={3}
                        value={editingDraft}
                        onChange={(e) => onEditingDraftChange(e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-600">
                        <input
                          type="checkbox"
                          checked={editingPrivacy}
                          onChange={(e) =>
                            onEditingPrivacyChange(e.target.checked)
                          }
                        />
                        {copy.keepPrivate}
                      </label>
                      <div className="flex gap-2">
                        <PrimaryButton
                          onClick={() => onUpdateNote(note)}
                          disabled={savingNotes[note.id]}
                        >
                          {savingNotes[note.id] ? copy.saving : copy.save}
                        </PrimaryButton>
                        <GhostButton onClick={onCancelEditing}>
                          {copy.cancel}
                        </GhostButton>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-[#0b1b29] leading-6 whitespace-pre-wrap">
                      {note.content}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="glass-panel space-y-3">
              <p className="text-sm text-[#0b1b29] font-semibold">
                {copy.addNote}
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder={copy.notePlaceholder}
                value={noteDraft}
                onChange={(e) => onDraftChange(e.target.value)}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={privacyDraft}
                  onChange={(e) => onPrivacyDraftChange(e.target.checked)}
                />
                {copy.markPrivate}
              </label>
              <SecondaryButton onClick={onCreateNote}>
                {savingNotes[`new-${company.id}`] ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner /> {copy.saving}
                  </span>
                ) : (
                  copy.saveNote
                )}
              </SecondaryButton>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
