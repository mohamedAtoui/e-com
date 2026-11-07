import Link from "next/link";
export default function CarryNotFound() {
  return (
    <section className="carry-container carry-error">
      <p className="carry-eyebrow">404 / CARRY</p>
      <h1>Ce modèle reste à découvrir.</h1>
      <p>Produit introuvable ou indisponible. / المنتج غير متوفر.</p>
      <Link className="carry-button" href="/carry#collection">
        La collection / المجموعة →
      </Link>
    </section>
  );
}
