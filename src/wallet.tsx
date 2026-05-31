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
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";
import "@mysten/dapp-kit/dist/index.css";

// The ONE React surface in an otherwise vanilla-TS app. @mysten/dapp-kit is
// React-only, so it lives in an isolated island mounted into a single host node;
// the connected account is bridged back to the vanilla app via a callback.

export type AccountListener = (address: string | null) => void;

const { networkConfig } = createNetworkConfig({
  testnet: { network: "testnet", url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { network: "mainnet", url: getJsonRpcFullnodeUrl("mainnet") },
  devnet: { network: "devnet", url: getJsonRpcFullnodeUrl("devnet") }
});

const queryClient = new QueryClient();

function AccountBridge({ onAccount }: { onAccount: AccountListener }) {
  const account = useCurrentAccount();
  useEffect(() => {
    onAccount(account?.address ?? null);
  }, [account, onAccount]);
  return <ConnectButton connectText="Connect Sui Wallet" />;
}

/**
 * Mount the wallet UI into `host`. `onAccount` fires with the active address
 * (or null when disconnected). Returns a teardown function.
 */
export function mountWallet(host: HTMLElement, onAccount: AccountListener): () => void {
  const root: Root = createRoot(host);
  root.render(
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>
          <AccountBridge onAccount={onAccount} />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
  return () => root.unmount();
}
