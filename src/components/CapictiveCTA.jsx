import capictiveLogo from "/public/static/peru_2026/capictive.jpeg";

export default function CapictiveCTA({ href }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="capictive-cta">
      <svg className="capictive-cta__deco" aria-hidden="true" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice">
      <circle cx="340" cy="80"  r="90"  fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="28" />
      <circle cx="340" cy="80"  r="130" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="18" />
      <circle className="capictive-cta__deco-extra" cx="60"  cy="140" r="70"  fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="20" />
      <circle className="capictive-cta__deco-extra" cx="200" cy="-20" r="60"  fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="14" />
      </svg>

      <div className="capictive-cta__content">
        <div className="capictive-cta__icon">
          <img src={capictiveLogo} alt="Capictive" />
        </div>

        <div className="capictive-cta__text">
          <h2>¡Investiga a los candidatos! 🔍</h2>
          <p>Compara en detalle tu Top 5 antes de votar.</p>
        </div>
      </div>

      <span className="capictive-cta__button">
        Comparar en Capictive →
      </span>
    </a>
  );
}
