"use client";

import { Box } from "@mui/material";
import { Translation } from "../types/ui";
import { GhostButton } from "./ui";

type FiltersBarProps = {
  sectors: string[];
  filter: string;
  onFilterChange: (value: string) => void;
  count: number;
  copy: Translation;
};

export function FiltersBar({
  sectors,
  filter,
  onFilterChange,
  count,
  copy,
}: FiltersBarProps) {
  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Box className="flex flex-wrap gap-2">
          <GhostButton
            onClick={() => onFilterChange("all")}
            sx={filter === "all" ? { borderColor: "#0ea5e9" } : undefined}
          >
            {copy.allSectors}
          </GhostButton>
          {sectors.map((sector) => (
            <GhostButton
              key={sector}
              onClick={() => onFilterChange(sector)}
              sx={filter === sector ? { borderColor: "#0ea5e9" } : undefined}
            >
              {sector}
            </GhostButton>
          ))}
        </Box>
        <div className="pill">{copy.companiesCount(count)}</div>
      </div>
    </div>
  );
}
