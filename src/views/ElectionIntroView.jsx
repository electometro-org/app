import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslate } from "@tolgee/react";
import { BrandLogoAlt } from "../components/BrandImage";
import { isValidMnemonic } from "../utils/mnemonicCodec";

export default function ElectionIntroView({ branding, electionId, electionLabel, onStart, onRestore, mnemonicWordList }) {
  const { t } = useTranslate();
  const description1 = t(`welcome.${electionId}.description1`);
  const description2 = t(`welcome.${electionId}.description2`);
  const [showFirstDescription, setShowFirstDescription] = useState(false);
  const [showSecondDescription, setShowSecondDescription] = useState(false);
  const secondDescriptionRef = useRef(null);
  const [secondDescriptionHeight, setSecondDescriptionHeight] = useState(0);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreInput, setRestoreInput] = useState("");
  const [restoreError, setRestoreError] = useState(false);

  // Translation labels for restore modal
  const restoreResultsButtonLabel = t("electionIntro.restoreResultsButton") === "electionIntro.restoreResultsButton"
    ? "Volver a ver mis resultados"
    : t("electionIntro.restoreResultsButton");
  const restoreTitleLabel = t("electionIntro.restoreTitle") === "electionIntro.restoreTitle"
    ? "Restaurar resultados"
    : t("electionIntro.restoreTitle");
  const restoreBodyLabel = t("electionIntro.restoreBody") === "electionIntro.restoreBody"
    ? "Si ya completaste el cuestionario y deseas ver tus resultados anteriores, abre el enlace que generaste con el botón 'Guardar' o ingresa tu código mnemónico aquí:"
    : t("electionIntro.restoreBody");
  const restorePlaceholderLabel = t("electionIntro.restorePlaceholder") === "electionIntro.restorePlaceholder"
    ? "ej: sol-luna-rio-mar..."
    : t("electionIntro.restorePlaceholder");
  const restoreButtonLabel = t("electionIntro.restoreButton") === "electionIntro.restoreButton"
    ? "Restaurar"
    : t("electionIntro.restoreButton");
  const restoreErrorLabel = t("electionIntro.restoreError") === "electionIntro.restoreError"
    ? "Código inválido. Verifica e intenta de nuevo."
    : t("electionIntro.restoreError");

  const handleRestoreSubmit = async () => {
    const trimmed = restoreInput.trim().toLowerCase();
    if (!trimmed || !isValidMnemonic(trimmed, mnemonicWordList)) {
      setRestoreError(true);
      return;
    }
    setRestoreError(false);
    const success = await onRestore(trimmed);
    if (success) {
      setShowRestoreModal(false);
      setRestoreInput("");
    } else {
      setRestoreError(true);
    }
  };

  const openRestoreModal = () => {
    setRestoreInput("");
    setRestoreError(false);
    setShowRestoreModal(true);
  };

  useEffect(() => {
    setShowFirstDescription(false);
    setShowSecondDescription(false);

    const rafId = requestAnimationFrame(() => {
      setShowFirstDescription(true);
    });

    const timeoutId = setTimeout(() => {
      setShowSecondDescription(true);
    }, 1500);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
    };
  }, [electionId]);

  useEffect(() => {
    const measureSecondDescription = () => {
      if (!secondDescriptionRef.current) return;
      setSecondDescriptionHeight(secondDescriptionRef.current.scrollHeight);
    };

    measureSecondDescription();
    window.addEventListener('resize', measureSecondDescription);
    return () => window.removeEventListener('resize', measureSecondDescription);
  }, [description2, electionId]);

  return (
    <div className="intro-container">
      <BrandLogoAlt branding={branding} />
      <h2>{t(`welcome.${electionId}.title`, { election: t(electionLabel) })}</h2>
      <p className="election-intro-pitch-inline">
        <span
          className={`election-intro-line election-intro-line--first ${showFirstDescription ? 'is-visible' : ''}`}
          aria-hidden={false}
        >
          {description1}
        </span>
        <span
          className={`election-intro-line election-intro-line--second ${showSecondDescription ? 'is-visible' : ''}`}
          aria-hidden={!showSecondDescription}
          ref={secondDescriptionRef}
          style={{ '--intro-second-max-height': `${secondDescriptionHeight}px` }}
        >
          {description2}
        </span>
      </p>
      <div className="election-intro-actions">
        <button onClick={onStart} className="election-intro-start-btn">
          {t('common.start')}
        </button>
        <button onClick={openRestoreModal} className="election-intro-restore-btn">
          {restoreResultsButtonLabel}
        </button>
      </div>

      {showRestoreModal && createPortal(
        <div className="election-intro-restore-modal-overlay" onClick={() => setShowRestoreModal(false)}>
          <div className="election-intro-restore-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{restoreTitleLabel}</h3>
            <p>{restoreBodyLabel}</p>
            <input
              type="text"
              className={`election-intro-restore-input ${restoreError ? "has-error" : ""}`}
              value={restoreInput}
              onChange={(e) => {
                setRestoreInput(e.target.value);
                setRestoreError(false);
              }}
              placeholder={restorePlaceholderLabel}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRestoreSubmit();
              }}
            />
            {restoreError && (
              <p className="election-intro-restore-error">{restoreErrorLabel}</p>
            )}
            <div className="election-intro-restore-actions">
              <button
                type="button"
                className="election-intro-restore-cancel"
                onClick={() => setShowRestoreModal(false)}
              >
                {t("common.close")}
              </button>
              <button
                type="button"
                className="election-intro-restore-submit"
                onClick={handleRestoreSubmit}
              >
                {restoreButtonLabel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
