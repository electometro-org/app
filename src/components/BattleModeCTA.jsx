export default function BattleModeCTA({ onClick,t }) {
  return (
    <section className="cta-container"
      style={{ position: "relative", width: "100%", marginBottom:"50px" }}
    >
      <img
        src="./capibarismo/capibara_fighter_CTA.png"
        alt="Modo Batalla"
        style={{
          width: "100%",
          borderRadius: "20px",
          display: "block",
        }}
      />

      <button onClick={onClick}
      className="results-fight-mode-btn">
  {t("results.fightMode.button","FIGHT MODE")}
</button>
    </section>
  );
}