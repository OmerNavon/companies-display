"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { User } from "firebase/auth";
import { FaCog, FaGlobe } from "react-icons/fa";
import { Translation } from "../types/ui";
import { Language } from "../lib/translations";
import { GhostButton, GoogleButton } from "./ui";

type AuthPreferencesCardProps = {
  authUser: User | null;
  authLoading: boolean;
  copy: Translation;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSignInGuest?: () => void;
  onSignInWithGoogle: () => void;
  onSignOut: () => void;
};

export function AuthPreferencesCard({
  authUser,
  authLoading,
  copy,
  language,
  onLanguageChange,
  onSignInGuest,
  onSignInWithGoogle,
  onSignOut,
}: AuthPreferencesCardProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLanguageSelect = (lang: Language) => {
    onLanguageChange(lang);
    handleClose();
  };

  return (
    <Box className="flex flex-col gap-3 min-w-[150px]">
      <Card
        variant="outlined"
        sx={{ borderRadius: "18px", boxShadow: "var(--shadow)" }}
      >
        <CardContent className="flex flex-col gap-3">
          {authUser ? (
            <>
              <div className="text-sm text-slate-600">{copy.signedInAs}</div>
              <div className="text-base font-semibold text-[#0b1b29]">
                {authUser.displayName || authUser.email}
              </div>
              <div className="flex items-center gap-2">
                <Tooltip title={copy.preferencesTitle}>
                  <IconButton
                    onClick={handleMenuOpen}
                    aria-label={copy.preferencesTitle}
                    className="ml-auto"
                  >
                    <FaCog />
                  </IconButton>
                </Tooltip>
                <GhostButton onClick={onSignOut} disabled={authLoading}>
                  {copy.signOut}
                </GhostButton>
              </div>
            </>
          ) : (
            <div className="flex gap-2 items-center">
              <GoogleButton onClick={onSignInWithGoogle} disabled={authLoading}>
                {copy.signInWithGoogle}
              </GoogleButton>
              {onSignInGuest && (
                <GhostButton onClick={onSignInGuest} disabled={authLoading}>
                  {copy.guest}
                </GhostButton>
              )}

              <Tooltip title={copy.preferencesTitle}>
                <IconButton
                  onClick={handleMenuOpen}
                  aria-label={copy.preferencesTitle}
                >
                  <FaCog />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </CardContent>{" "}
      </Card>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => handleLanguageSelect("en")}>
          <ListItemIcon>
            <FaGlobe />
          </ListItemIcon>
          <ListItemText>{copy.languageOptions.en}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleLanguageSelect("he")}>
          <ListItemIcon>
            <FaGlobe />
          </ListItemIcon>
          <ListItemText>{copy.languageOptions.he}</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
