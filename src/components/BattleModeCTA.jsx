export default function BattleModeCTA({ onClick }) {
  return (
    <section
      style={{ position: "relative", width: "100%", marginBottom:"50px" }}
    >
      <img
        src="./capibarismo/capibara_fighter_CTA.jpeg"
        alt="Modo Batalla"
        style={{
          width: "100%",
          borderRadius: "20px",
          display: "block",
        }}
      />

      <button onClick={onClick}
      style={{
          position: "absolute",
          right: "7%",
          top: "60%",
          transform: "translateY(-50%)",}}
      
      >
  <span>⚔️</span>
  <span>ENTRAR EN<br />MODO BATALLA</span>
</button>
    </section>
  );
}