"use client";

import { InputAdornment, TextField, Typography, Box } from "@mui/material";
import { Translation } from "../types/ui";
import { FaSearch } from "react-icons/fa";

type HeroSectionProps = {
  copy: Translation;
  searchTerm: string;
  onSearchChange: (value: string) => void;
};

export function HeroSection({
  copy,
  searchTerm,
  onSearchChange,
}: HeroSectionProps) {
  return (
    <Box className="flex flex-col gap-4">
      <Typography
        variant="h3"
        fontWeight={800}
        color="#0b1b29"
        sx={{ fontFamily: "var(--font-noto-sans), 'Noto Sans', sans-serif" }}
      >
        {copy.heroTitle}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{
          maxWidth: "52ch",
          fontFamily: "var(--font-noto-sans), 'Noto Sans', sans-serif",
        }}
      >
        {copy.heroSubtitle}
      </Typography>

      <TextField
        fullWidth
        placeholder={copy.searchPlaceholder}
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <FaSearch color="var(--accent-strong)" />
              </InputAdornment>
            ),
          },
        }}
        sx={{
          backgroundColor: "#ffffff",
          borderRadius: "18px",
          "& .MuiOutlinedInput-root": {
            borderRadius: "18px",
            boxShadow: "var(--shadow)",
            "& fieldset": { borderColor: "var(--border)" },
            "&:hover fieldset": { borderColor: "var(--accent-strong)" },
            "&.Mui-focused fieldset": {
              borderColor: "var(--accent-strong)",
            },
          },
        }}
      />
    </Box>
  );
}
