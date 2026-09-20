import { useEffect, useState } from "react";
import { useTranslate } from "@tolgee/react";
import "./HamburgerMenu.css";

/**
 * Top-right hamburger button. Opens a small dropdown with "Conocer más" (navigation panel)
 * and, when available, "Restart". Without a restart action it opens the navigation panel directly.
 */
export default function HamburgerMenu({ showRestart, onRestart, onOpenMenu, menuOpen }) {
  const { t } = useTranslate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleToggle = () => {
    if (!showRestart) {
      onOpenMenu();
      return;
    }
    setOpen(prev => !prev);
  };

  const choose = (action) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        className="menu-button hamburger-button"
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={showRestart ? open : menuOpen}
      >
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
          <path d="M3 5.5h16M3 11h16M3 16.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
        <span className="hamburger-label">{t("common.menu")}</span>
      </button>

      {open && (
        <>
          <div className="menu-backdrop" role="presentation" onClick={() => setOpen(false)} onKeyDown={() => {}} />
          <ul className="menu-panel hamburger-actions">
            <li className="menu-list-item">
              <button type="button" className="hamburger-action" onClick={() => choose(onOpenMenu)}>
                {t("nav.learnMore")}
              </button>
            </li>
            <li className="menu-list-item">
              <button type="button" className="hamburger-action" onClick={() => choose(onRestart)}>
                {t("common.restart")}
              </button>
            </li>
          </ul>
        </>
      )}
    </>
  );
}
