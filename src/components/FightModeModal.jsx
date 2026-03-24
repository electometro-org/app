import React from "react";
import { useTranslate } from "@tolgee/react";
import { createPortal } from "react-dom";
import { buildCapibarismoUrl, extractCandidateName } from "../constants/capibarismoMapping";

const CANDIDATE_PHOTO_EXTS = ["jpg", "jpeg", "png"];

function slugifyAssetName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function FightModeModal({
  isOpen,
  onClose,
  topCandidates,
  config,
  branding,
  resolvedCandidatePhotoUrls,
}) {
  const { t } = useTranslate();

  const titleLabel = t("results.fightMode.title") === "results.fightMode.title"
    ? "FIGHT MODE"
    : t("results.fightMode.title");
  const descriptionLabel = t("results.fightMode.description") === "results.fightMode.description"
    ? "Seras redirigido a capibarismo.com con tus 4 mejores candidatos"
    : t("results.fightMode.description");
  const ctaLabel = t("results.fightMode.cta") === "results.fightMode.cta"
    ? "A LUCHAR!"
    : t("results.fightMode.cta");
  const cancelLabel = t("results.fightMode.cancel") === "results.fightMode.cancel"
    ? "Cancelar"
    : t("results.fightMode.cancel");

  if (!isOpen) return null;

  const handleFight = () => {
    const url = buildCapibarismoUrl(topCandidates);
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  const getCandidatePhotoUrl = (candidate) => {
    const fullName = candidate.displayName || candidate.name || "";
    const name = extractCandidateName(fullName);
    const slug = slugifyAssetName(name);

    // Check resolved URLs first
    if (resolvedCandidatePhotoUrls && resolvedCandidatePhotoUrls[slug]) {
      return resolvedCandidatePhotoUrls[slug];
    }

    // Fallback to constructing URL
    const baseUrl = config?.assetsBaseUrl || "";
    const assetsPath = config?.assetsPath || "";
    if (baseUrl && slug) {
      return `${baseUrl}/${assetsPath}candidate_photos/${slug}.jpg`;
    }
    return null;
  };

  const candidates = topCandidates.slice(0, 4);

  return createPortal(
    <div className="fight-mode-overlay" onClick={onClose}>
      <div className="fight-mode-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fight-mode-header">
          <div className="fight-mode-logos">
            <img
              src="https://capibarismo.com/capi_logo.webp"
              alt="Capibarismo"
              className="fight-mode-logo fight-mode-logo--capibarismo"
            />
            <span className="fight-mode-logo-divider">x</span>
            <img
              src={branding?.logo || "/favicon.svg"}
              alt="decide.pe"
              className="fight-mode-logo fight-mode-logo--decide"
            />
          </div>
          <h2 className="fight-mode-title">{titleLabel}</h2>
        </div>

        <p className="fight-mode-description">{descriptionLabel}</p>

        <div className="fight-mode-candidate-grid">
          {candidates.map((candidate, idx) => {
            const photoUrl = getCandidatePhotoUrl(candidate);
            const name = extractCandidateName(candidate.displayName || candidate.name);
            return (
              <div key={candidate.key || idx} className="fight-mode-candidate">
                <div className="fight-mode-candidate-photo">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={name}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="fight-mode-candidate-placeholder">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="fight-mode-candidate-name">{name}</span>
                <span className="fight-mode-candidate-rank">#{idx + 1}</span>
              </div>
            );
          })}
        </div>

        <div className="fight-mode-actions">
          <button
            type="button"
            className="fight-mode-cta"
            onClick={handleFight}
          >
            {ctaLabel}
          </button>
          <button
            type="button"
            className="fight-mode-cancel"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
