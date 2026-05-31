import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  SuiClientProvider,
  WalletProvider,
  createNetworkConfig,
  useWallets,
  useConnectWallet,
  useDisconnectWallet,
  useCurrentWallet,
  useCurrentAccount
} from "@mysten/dapp-kit";
import { getJsonRpcFullnodeUrl } from "@mysten/sui/jsonRpc";

// Custom kami-styled wallet UI built on dapp-kit's wallet hooks (no built-in
// ConnectButton/modal). `WalletProviders` supplies the React context for the
// whole app; `WalletIsland` renders the trigger button + connect modal.

type Wallet = ReturnType<typeof useWallets>[number];

const { networkConfig } = createNetworkConfig({
  testnet: { network: "testnet", url: getJsonRpcFullnodeUrl("testnet") },
  mainnet: { network: "mainnet", url: getJsonRpcFullnodeUrl("mainnet") },
  devnet: { network: "devnet", url: getJsonRpcFullnodeUrl("devnet") }
});

const queryClient = new QueryClient();

export function WalletProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="testnet">
        <WalletProvider autoConnect>{children}</WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  );
}

function shortAddress(address: string): string {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

// ── Trigger button (horizontal, top bar) ──────────────────────────────────────
function WalletButton({ onOpen }: { onOpen: () => void }) {
  const { currentWallet } = useCurrentWallet();
  const account = useCurrentAccount();

  if (currentWallet && account) {
    return (
      <button className="wallet-tab is-connected" type="button" onClick={onOpen}>
        <span className="wallet-tab-mark" aria-hidden="true">済</span>
        <span className="wallet-tab-addr">{shortAddress(account.address)}</span>
      </button>
    );
  }

  return (
    <button className="wallet-tab" type="button" onClick={onOpen}>
      接続
    </button>
  );
}

// ── Connect / account modal ───────────────────────────────────────────────────
function WalletModal({ onClose }: { onClose: () => void }) {
  const wallets = useWallets();
  const { currentWallet } = useCurrentWallet();
  const account = useCurrentAccount();
  const { mutateAsync: connectWallet } = useConnectWallet();
  const { mutateAsync: disconnectWallet } = useDisconnectWallet();
  const [connecting, setConnecting] = useState(false);

  // Escape closes the modal (a11y escape route).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleConnect(wallet: Wallet) {
    try {
      setConnecting(true);
      await connectWallet({ wallet });
      onClose();
    } catch {
      // user cancelled or wallet error — leave the modal open
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    onClose();
  }

  return (
    <div className="wallet-overlay" onClick={onClose}>
      <div
        className="wallet-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Wallet"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wallet-modal-head">
          <div>
            <p className="eyebrow">{currentWallet ? "接続済み" : "ウォレット"}</p>
            <h3>{currentWallet ? "Wallet" : "Select Wallet"}</h3>
            {!currentWallet && <p className="wallet-modal-sub">Choose a wallet to connect.</p>}
          </div>
          <button className="wallet-modal-close" type="button" aria-label="Close" autoFocus onClick={onClose}>
            ×
          </button>
        </header>

        <div className="wallet-modal-body">
          {currentWallet ? (
            <div className="wallet-connected">
              <div className="wallet-connected-id">
                {currentWallet.icon && (
                  <img src={currentWallet.icon} alt={currentWallet.name} width={48} height={48} />
                )}
                <p className="wallet-connected-name">{currentWallet.name}</p>
              </div>

              {account && (
                <div className="wallet-address">
                  <p className="wallet-address-label">Address</p>
                  <p className="wallet-address-value">
                    {account.address.slice(0, 10)}…{account.address.slice(-8)}
                  </p>
                </div>
              )}

              <button className="wallet-disconnect" type="button" onClick={handleDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <div className="wallet-list">
              {wallets.map((wallet) => (
                <button
                  key={wallet.name}
                  className="wallet-list-item"
                  type="button"
                  disabled={connecting}
                  onClick={() => handleConnect(wallet)}
                >
                  {wallet.icon && (
                    <img src={wallet.icon} alt={wallet.name} width={36} height={36} />
                  )}
                  <span>
                    <span className="wallet-list-name">{wallet.name}</span>
                    <span className="wallet-list-sub">Connect {wallet.name}</span>
                  </span>
                </button>
              ))}

              {wallets.length === 0 && (
                <div className="wallet-empty">
                  <p>No wallets detected.</p>
                  <p className="wallet-empty-hint">Install a Sui wallet extension to continue.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WalletIsland() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <WalletButton onOpen={() => setOpen(true)} />
      {open && <WalletModal onClose={() => setOpen(false)} />}
    </>
  );
}
