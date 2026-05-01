import { Link, useLocation } from "react-router-dom";
import {
  Database,
  BarChart3,
  Upload,
  ShoppingCart,
  Menu,
  X,
  Bot,
  Wallet,
  LogOut,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { isConnected, getPublicKey } from "@stellar/freighter-api";
import clsx from "clsx";
import { LocaleSwitcher, useI18n } from "../../i18n";
import { getPublicKey, isConnected } from "@stellar/freighter-api"; // Import Freighter API
import { truncateAddress } from "../../lib/utils"; // Import utility for address truncation

const NAV_LINKS = [
  { to: "/marketplace", key: "nav.marketplace", icon: ShoppingCart, dataTour: "marketplace-link" },
  { to: "/agent", key: "nav.agent", icon: Bot, dataTour: "agent-link" },
  { to: "/sell", key: "nav.sell", icon: Upload, dataTour: "sell-link" },
  { to: "/dashboard", key: "nav.dashboard", icon: BarChart3, dataTour: "dashboard-link" },
] as const;

export default function Navbar() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useI18n();
  const mobileMenuId = useId();

  // Wallet connection state
  const [publicKey, setPublicKey] = useState<string | null>(
    localStorage.getItem("hazina_wallet")
  );

  const handleConnect = async () => {
    try {
      const connected = await isConnected();
      if (connected) {
        const pubKey = await getPublicKey();
        if (pubKey) {
          setPublicKey(pubKey);
          localStorage.setItem("hazina_wallet", pubKey);
        }
      } else {
        window.open("https://www.freighter.app/", "_blank");
      }
    } catch (err) {
      console.error("Connection failed:", err);
    }
  };

  const handleDisconnect = () => {
    setPublicKey(null);
    localStorage.removeItem("hazina_wallet");
  };

  // Verify connection on mount to handle persistence across refreshes
  useEffect(() => {
    const verifyConnection = async () => {
      if (publicKey) {
        const connected = await isConnected();
        if (!connected) {
          handleDisconnect();
        }
      }
    };
    verifyConnection();
  }, [publicKey]);

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length < 8) return addr;
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Load wallet from localStorage on mount and verify with Freighter
  useEffect(() => {
    const storedWallet = localStorage.getItem("hazina-wallet");
    if (storedWallet) {
      // Check if Freighter is available and authorized
      isConnected().then(async (connected) => {
        if (connected) {
          try {
            const currentFreighterKey = await getPublicKey();
            if (currentFreighterKey === storedWallet) {
              setConnectedWallet(currentFreighterKey);
            } else {
              // Stored key doesn't match current Freighter connection, clear it
              localStorage.removeItem("hazina-wallet");
            }
          } catch (error) {
            // User might have disconnected from Freighter directly, or error occurred
            console.warn("Freighter getPublicKey failed during re-check:", error);
            localStorage.removeItem("hazina-wallet");
          }
        } else {
          // Freighter is not connected or not authorized for this site
          localStorage.removeItem("hazina-wallet");
        }
      }).catch((error) => {
        // Error checking Freighter connection (e.g., Freighter not installed or API unavailable)
        console.warn("Freighter isConnected check failed:", error);
        localStorage.removeItem("hazina-wallet");
      });
    }
  }, []);

  // Persist wallet to localStorage when it changes
  useEffect(() => {
    if (connectedWallet) {
      localStorage.setItem("hazina-wallet", connectedWallet);
    } else {
      localStorage.removeItem("hazina-wallet");
    }
  }, [connectedWallet]);

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    try {
      const publicKey = await getPublicKey();
      setConnectedWallet(publicKey);
      setShowDisconnect(false); // Hide disconnect option after connecting
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // Optionally, show a user-friendly error message
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setConnectedWallet(null);
    setShowDisconnect(false); // Hide disconnect option after disconnecting
  }, []);

  const toggleDisconnectOptions = useCallback(() => {
    setShowDisconnect((prev) => !prev);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="mx-3 mt-3 sm:mx-4 sm:mt-4">
        <nav className="glass-card-gold px-4 py-3 sm:px-5 sm:py-4 xl:px-6 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            to="/"
            className="flex min-w-0 items-center gap-3 group"
            aria-label="Hazina Home"
          >
            <div className="w-9 h-9 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center group-hover:border-gold/60 transition-all duration-300 shrink-0">
              <Database className="w-5 h-5 text-gold" aria-hidden="true" />
            </div>
            <span className="font-display font-semibold text-lg sm:text-xl text-foreground group-hover:text-gold transition-colors duration-300 truncate">
              {t("nav.brand")}
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden xl:flex items-center gap-1.5 flex-nowrap">
            {NAV_LINKS.map(({ to, key, icon: Icon, dataTour }) => (
              <Link
                key={to}
                to={to}
                data-tour={dataTour}
                className={clsx(
                  "flex shrink-0 items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium font-body transition-all duration-200",
                  pathname === to
                    ? "bg-gold/15 text-gold border border-gold/25"
                    : "text-foreground-muted hover:text-foreground hover:bg-surface-2",
                )}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                {t(key)}
              </Link>
            ))}
          </div>

          {/* CTA and Wallet (Desktop) */}
          <div className="hidden xl:flex items-center gap-3 shrink-0">
            <LocaleSwitcher />

            {connectedWallet ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={toggleDisconnectOptions}
                  className="flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium font-body transition-all duration-200 bg-gold/15 text-gold border border-gold/25 hover:bg-gold/25"
                  aria-expanded={showDisconnect}
                  aria-haspopup="true"
                >
                  <Wallet className="w-4 h-4" aria-hidden="true" />
                  {truncateAddress(connectedWallet)}
                </button>
                {showDisconnect && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-surface-1 ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                      <button
                        onClick={disconnectWallet}
                        className="block w-full text-left px-4 py-2 text-sm text-foreground-muted hover:bg-surface-2 hover:text-foreground"
                        role="menuitem"
                      >
                        {t("nav.disconnect")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={connectWallet}
                disabled={isConnecting}
                className="btn-gold text-sm px-4 py-2 whitespace-nowrap"
              >
                {isConnecting ? "Connecting..." : t("nav.connectWallet")}
              </button>
            )}

            <Link
              to="/marketplace"
              className="btn-gold text-sm px-4 py-2 whitespace-nowrap"
            >
              {t("common.actions.browseData")}
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            type="button"
            className="xl:hidden flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-surface/70 text-foreground-muted hover:text-foreground hover:border-gold/30 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            aria-label={t("nav.mobileMenu")}
          >
            {mobileOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </nav>

        {/* Mobile menu */}
        <div
          className={clsx(
            "xl:hidden fixed inset-0 z-40 transition-all duration-300",
            mobileOpen ? "pointer-events-auto" : "pointer-events-none",
          )}
          aria-hidden={!mobileOpen}
        >
          <button
            type="button"
            className={clsx(
              "absolute inset-0 bg-void/72 backdrop-blur-sm transition-opacity duration-300",
              mobileOpen ? "opacity-100" : "opacity-0",
            )}
            onClick={() => setMobileOpen(false)}
            aria-label={t("nav.mobileMenu")}
          />
          <div
            id={mobileMenuId}
            className={clsx(
              "absolute right-3 top-20 bottom-3 left-3 sm:left-auto sm:w-[420px] glass-card-gold p-5 sm:p-6 flex flex-col gap-5 overflow-y-auto transition-all duration-300",
              mobileOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-4 opacity-0",
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border-gold/15 pb-4">
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.28em] text-gold/70 font-body mb-2">
                  Hazina
                </p>
                <p className="text-sm text-foreground-muted font-body leading-relaxed">
                  {t("common.actions.browseData")}
                </p>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gold/15 bg-surface/60 text-foreground-muted hover:text-foreground hover:border-gold/30 transition-colors"
                onClick={() => setMobileOpen(false)}
                aria-label={t("nav.mobileMenu")}
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-gold/10 bg-void/25 p-3">
              <LocaleSwitcher className="w-full" />

              {publicKey ? (
                <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-gold/10 border border-gold/25 text-gold">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 shrink-0" aria-hidden="true" />
                    <span className="text-sm font-mono font-medium truncate">
                      {truncateAddress(publicKey)}
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="p-1 hover:text-white transition-colors"
                    aria-label={t("common.actions.disconnect")}
                  >
                    <LogOut className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="flex items-center justify-center gap-3 w-full px-4 py-3 rounded-xl border border-gold/30 text-gold hover:bg-gold/10 transition-all text-sm font-medium"
                >
                  <Wallet className="w-5 h-5" aria-hidden="true" />
                  {t("common.actions.connectWallet")}
                </button>
              )}
            </div>

            {/* Wallet (Mobile) */}
            <div className="rounded-2xl border border-gold/10 bg-void/25 p-3">
              {connectedWallet ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-4 py-3.5 text-sm font-medium font-body bg-gold/15 text-gold border border-gold/25 rounded-xl">
                    <Wallet className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{truncateAddress(connectedWallet)}</span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="block w-full text-left px-4 py-3.5 text-sm font-medium font-body transition-all duration-200 text-foreground-muted hover:text-foreground hover:bg-surface-2 border border-transparent rounded-xl"
                  >
                    {t("nav.disconnect")}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="btn-gold text-sm px-4 py-3.5 whitespace-nowrap w-full"
                >
                  {isConnecting ? "Connecting..." : t("nav.connectWallet")}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {NAV_LINKS.map(({ to, key, icon: Icon, dataTour }) => (
                <Link
                  key={to}
                  to={to}
                  data-tour={dataTour}
                  onClick={() => setMobileOpen(false)}
                  className={clsx(
                    "flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium font-body transition-all duration-200",
                    pathname === to
                      ? "bg-gold/15 text-gold border border-gold/25"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-2 border border-transparent",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="truncate">{t(key)}</span>
                  </span>
                  <span className="text-gold/60 text-base" aria-hidden="true">
                    +
                  </span>
                </Link>
              ))}
            </div>

            <Link
              to="/marketplace"
              className="btn-gold text-sm text-center mt-auto whitespace-nowrap"
              onClick={() => setMobileOpen(false)}
            >
              {t("common.actions.browseData")}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
