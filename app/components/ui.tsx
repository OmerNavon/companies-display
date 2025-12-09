"use client";

import { Button, ButtonProps } from "@mui/material";

export const Spinner = () => <span className="spinner" aria-hidden="true" />;

export const PrimaryButton = (props: ButtonProps) => (
  <Button
    variant="contained"
    disableElevation
    sx={{
      textTransform: "none",
      borderRadius: "14px",
      fontWeight: 700,
      background:
        "linear-gradient(135deg, var(--accent), var(--accent-strong))",
      boxShadow: "0 12px 26px rgba(14, 165, 233, 0.25)",
      "&:hover": {
        boxShadow: "0 14px 30px rgba(14, 165, 233, 0.35)",
      },
    }}
    {...props}
  />
);

export const SecondaryButton = (props: ButtonProps) => (
  <Button
    variant="contained"
    disableElevation
    sx={{
      textTransform: "none",
      borderRadius: "14px",
      fontWeight: 700,
      color: "#0b1b29",
      background:
        "linear-gradient(135deg, var(--secondary), var(--secondary-strong))",
      boxShadow: "0 12px 26px rgba(236, 72, 153, 0.25)",
      "&:hover": {
        boxShadow: "0 14px 30px rgba(236, 72, 153, 0.35)",
      },
    }}
    {...props}
  />
);

export const GhostButton = (props: ButtonProps) => (
  <Button
    variant="outlined"
    sx={{
      textTransform: "none",
      borderRadius: "24px",
      borderColor: "var(--border)",
      color: "var(--foreground)",
      backgroundColor: "rgba(255,255,255,0.9)",
      "&:hover": {
        borderColor: "var(--accent-strong)",
        boxShadow: "0 10px 20px rgba(15,23,42,0.1)",
      },
    }}
    {...props}
  />
);
export const GoogleButton = ({ children, ...props }: ButtonProps) => (
  <Button
    variant="outlined"
    disableElevation
    startIcon={
      <span style={{ display: "inline-flex", width: 18, height: 18 }}>
        <svg
          width="18"
          height="18"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill="#EA4335"
            d="M24 9.5c3.9 0 7.1 1.3 9.3 3.1l7-7C35.6 2 30.1 0 24 0 14.9 0 6.9 4.5 2.6 11l8.2 6.4C12.4 12 17.7 9.5 24 9.5z"
          />
          <path
            fill="#34A853"
            d="M46.5 24.5c0-1.6-.1-3.1-.4-4.6H24v9.1h12.9c-.6 3.1-2.6 5.6-5.6 7.1l8.6 6.6C44.8 38.6 46.5 32.9 46.5 24.5z"
          />
          <path
            fill="#FBBC05"
            d="M10.8 28.6A14.3 14.3 0 0 1 9.6 24c0-1.6.3-3.2.8-4.6L2.6 12C1.7 13.7 1.2 15.6 1.2 17.6c0 4.1 1.6 7.8 4.6 10.6l5 3.8z"
          />
          <path
            fill="#4285F4"
            d="M24 48c6.1 0 11.6-1.9 15.4-5.2l-7.3-5.6c-2 1.4-4.6 2.3-8 2.3-6.3 0-11.6-3.1-14.3-7.7L2.4 34.2C6.9 43.5 14.9 48 24 48z"
          />
        </svg>
      </span>
    }
    sx={{
      textTransform: "none",
      borderRadius: 4,
      height: 40,
      backgroundColor: "#fff",
      color: "rgba(0,0,0,0.87)",
      border: "1px solid #dadce0",
      boxShadow: "none",
      fontWeight: 500,
      fontSize: 14,
      padding: "6px 12px",
      "&:hover": {
        backgroundColor: "#f7f7f7",
        borderColor: "#c6c6c6",
        boxShadow: "none",
      },
      "& .MuiButton-startIcon": {
        marginLeft: 4,
      },
    }}
    {...props}
  >
    {children ?? "Sign in with Google"}
  </Button>
);
