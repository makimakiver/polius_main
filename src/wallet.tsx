import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  ConnectButton,
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
  useCurrentAccount
} from "@mysten/dapp-kit";
import type { ThemeVars } from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import "@mysten/dapp-kit/dist/index.css";

// The ONE React surface in an otherwise vanilla-TS app. @mysten/dapp-kit is
// React-only, so it lives in an isolated island mounted into a single host node;
// the connected account is bridged back to the vanilla app via an optional callback.

export type AccountListener = (address: string | null) => void;

const { networkConfig } = createNetworkConfig({
  testnet: { network: "testnet", url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { network: "mainnet", url: getJsonRpcFullnodeUrl("mainnet") },
  devnet: { network: "devnet", url: getJsonRpcFullnodeUrl("devnet") }
});

const queryClient = new QueryClient();

// "Civilised" kami theme for the dapp-kit ConnectButton + connect modal: warm
// parchment surfaces, an ink-blue primary action, serif (Newsreader) hierarchy,
// editorial radii, and a stronger overlay scrim so the modal reads as deliberate.
const kamiTheme = {
  blurs: {
    modalOverlay: "blur(3px)"
  },
  backgroundColors: {
    primaryButton: "#1f3a5f",
    primaryButtonHover: "#274b78",
    outlineButtonHover: "#f1ead8",
    walletItemHover: "rgba(31, 58, 95, 0.06)",
    walletItemSelected: "#fffdf7",
    modalOverlay: "rgba(26, 28, 34, 0.5)",
    modalPrimary: "#f8f2e4",
    modalSecondary: "#efe6d2",
    iconButton: "transparent",
    iconButtonHover: "#efe6d2",
    dropdownMenu: "#f8f2e4",
    dropdownMenuSeparator: "#e2d7bd"
  },
  borderColors: {
    outlineButton: "#d8ccae"
  },
  colors: {
    primaryButton: "#f8f2e4",
    outlineButton: "#1f3a5f",
    body: "#2b2a26",
    bodyMuted: "#6f6a5f",
    bodyDanger: "#a8442a",
    iconButton: "#2b2a26"
  },
  radii: {
    small: "4px",
    medium: "7px",
    large: "10px",
    xlarge: "14px"
  },
  shadows: {
    primaryButton: "0 2px 10px rgba(31, 58, 95, 0.22)",
    walletItemSelected: "0 1px 4px rgba(43, 42, 38, 0.12)"
  },
  fontWeights: {
    normal: "400",
    medium: "500",
    bold: "600"
  },
  fontSizes: {
    small: "14px",
    medium: "15px",
    large: "18px",
    xlarge: "22px"
  },
  typography: {
    fontFamily: '"Newsreader", Georgia, "Times New Roman", serif',
    fontStyle: "normal",
    lineHeight: "1.35",
    letterSpacing: "normal"
  }
} satisfies ThemeVars;

function AccountBridge({ onAccount }: { onAccount?: AccountListener }) {
  const account = useCurrentAccount();
  useEffect(() => {
    onAccount?.(account?.address ?? null);
  }, [account, onAccount]);
  return <ConnectButton className="wallet-connect-btn" connectText="Connect Wallet" />;
}

/**
 * Mount the wallet UI into `host`. `onAccount` (optional) fires with the active
 * address (or null when disconnected). Returns a teardown function.
 */
export function mountWallet(host: HTMLElement, onAccount?: AccountListener): () => void {
  const root: Root = createRoot(host);
  root.render(
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect theme={kamiTheme}>
          <AccountBridge onAccount={onAccount} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
  return () => root.unmount();
}
