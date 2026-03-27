import { createPortal } from "react-dom";
import capictiveLogo from "/public/static/peru_2026/capictive.jpeg";

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function CapictiveModal({
  isOpen,
  onClose,
  top5Rows,
  captiveUrl,
  branding,
  resolvedLogoUrls,
}) {
  if (!isOpen) return null;

  const handleCompare = () => {
    window.open(captiveUrl, "_blank", "noopener,noreferrer");
    onClose();
  };

  return createPortal(
    <div className="capictive-modal-overlay" onClick={onClose}>
      <div className="capictive-modal" onClick={(e) => e.stopPropagation()}>
        <div className="capictive-modal-header">
          <div className="capictive-modal-logos">
            <img
                src={branding?.logo || "/favicon.svg"}
                alt="decide.pe"
                className="capictive-modal-logo capictive-modal-logo--brand"
            />
            <span className="capictive-modal-logo-divider">×</span>
            <img
              src={capictiveLogo}
              alt="Capictive"
              className="capictive-modal-logo capictive-modal-logo--capictive"
            />
          </div>
          <h2 className="capictive-modal-title">¡Investiga antes de votar!</h2>
        </div>

        <p className="capictive-modal-description">
          Compara tu Top 5 en detalle en Capictive antes de decidir tu voto.
        </p>

        <div className="capictive-modal-party-grid">
          {top5Rows.map(({ row }, i) => {
            const name = row.displayName || row.name || "";
            const slug = slugify(name);
            const logoUrl = resolvedLogoUrls?.[slug];
            const rank = row.payload?.ranking ?? i + 1;
            return (
              <div key={i} className="capictive-modal-party">
                <div className="capictive-modal-party-logo">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={name}
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="capictive-modal-party-placeholder">
                      {name.charAt(0)}
                    </div>
                  )}
                </div>
                <span className="capictive-modal-party-name">{name}</span>
                <span className="capictive-modal-party-rank">#{rank}</span>
              </div>
            );
          })}
        </div>

        <div className="capictive-modal-actions">
          <button
            type="button"
            className="capictive-modal-cta"
            onClick={handleCompare}
          >
            Comparar en Capictive →
          </button>
          <button
            type="button"
            className="capictive-modal-cancel"
            onClick={onClose}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}