// Token contract address (Solana mint). Set it here when the token launches,
// or provide VITE_CONTRACT_ADDRESS as a Vercel env var (no code change needed).
// Empty string => the site shows a "coming soon" state.
export const CONTRACT_ADDRESS: string =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined)?.trim() || ''
