"use client";
export default function CarryError({ reset }: { reset: () => void }) {
  return (
    <section className="carry-container carry-error">
      <h1>Un petit contretemps.</h1>
      <p>
        La collection n’a pas pu être chargée. Réessayez dans un instant. / يرجى
        المحاولة مرة أخرى.
      </p>
      <button className="carry-button" onClick={reset}>
        Réessayer / إعادة المحاولة
      </button>
    </section>
  );
}
