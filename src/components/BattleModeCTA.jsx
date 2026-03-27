const BASE_URL = import.meta.env.BASE_URL;

export default function BattleModeCTA({ onClick, t, className }) {
  return (
    <section className={`cta-container${className ? ` ${className}` : ""}`}
      style={{ position: "relative", width: "100%", borderRadius: "25px", cursor: "pointer" }}
      onClick={onClick}
    >
      <div style={{ borderRadius: "20px", overflow: "hidden" }}>
        <img
          src={`${BASE_URL}capibarismo/capibara_fighter_CTA.png`}
          alt="Modo Batalla"
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>

      <button className="results-fight-mode-btn" tabIndex={-1} aria-hidden="true">
        {t("results.fightMode.button","FIGHT MODE")}
      </button>
    </section>
  );
}