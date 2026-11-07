"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Banknote, MapPin, PackageCheck } from "lucide-react";
import { useLang } from "@/components/storefront/lang-provider";
import { productImageUrl } from "@/lib/images";
import { productHref } from "@/lib/shop-routing";
import { formatDZD } from "@/lib/money";
import { CARRY_PREVIEW_PRICE } from "@/lib/carry-preview";
import type { ProductRow } from "@/types/database.types";

export function CarryLanding({ products }: { products: ProductRow[] }) {
  const { lang } = useLang();
  const ar = lang === "ar";
  return (
    <>
      <section
        id="collection"
        className="carry-collection carry-catalog-first carry-container"
      >
        <div className="carry-section-heading">
          <div>
            <h1>{ar ? "اكتشف المجموعة." : "La collection."}</h1>
          </div>
          <span className="carry-count">
            {products.length
              ? `${products.length} ${ar ? "منتج" : "produit(s)"}`
              : ar
                ? "عرض المجموعة · المنتجات قريبًا"
                : "Aperçu de la collection · Produits à venir"}
          </span>
        </div>
        {products.length ? (
          <div className="carry-product-grid">
            {products.map((p, index) => (
              <Link
                href={productHref(p.slug)}
                key={p.id}
                className="carry-product-card"
              >
                <div className="carry-card-image">
                  <Image
                    src={
                      p.images[0]
                        ? productImageUrl(p.images[0])
                        : "/carry-bag.svg"
                    }
                    alt={ar ? p.name_ar || p.name_fr : p.name_fr}
                    fill
                    sizes="(max-width: 1000px) 50vw, 33vw"
                    priority={index < 2}
                  />
                  {p.stock_quantity - p.reserved_quantity <= 0 && (
                    <span className="carry-stock-label">
                      {ar ? "غير متوفر" : "Épuisé"}
                    </span>
                  )}
                  <span className="carry-card-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                </div>
                <div className="carry-card-info">
                  <h3>{ar ? p.name_ar || p.name_fr : p.name_fr}</h3>
                  <span className="carry-card-price">
                    {formatDZD(p.price)}
                    {p.compare_at_price && p.compare_at_price > p.price ? (
                      <del>{formatDZD(p.compare_at_price)}</del>
                    ) : null}
                  </span>
                </div>
                <p>{ar ? "اكتشف التفاصيل" : "Découvrir les détails"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <>
            <div className="carry-product-grid">
              {[1, 2].map((number) => (
                <Link
                  href="/carry/preview"
                  key={number}
                  className="carry-product-card"
                >
                  <div className="carry-card-image">
                    <Image
                      src="/carry-bag.svg"
                      alt={
                        ar
                          ? "رسم توضيحي، ليس منتجًا للبيع"
                          : "Illustration de démonstration, pas un produit en vente"
                      }
                      fill
                      sizes="(max-width: 1000px) 50vw, 33vw"
                      priority
                    />
                    <span className="carry-stock-label">
                      {ar ? "عرض تجريبي" : "Aperçu du design"}
                    </span>
                    <span className="carry-card-arrow">
                      <ArrowUpRight size={22} />
                    </span>
                  </div>
                  <div className="carry-card-info">
                    <h3>
                      {ar ? `منتجك ${number}` : `Votre produit ${number}`}
                    </h3>
                    <span className="carry-card-price">
                      {formatDZD(CARRY_PREVIEW_PRICE)}
                    </span>
                  </div>
                  <p>
                    {ar
                      ? "عرض تجريبي · غير متوفر للبيع"
                      : "Prix d’exemple · Pas en vente"}
                  </p>
                </Link>
              ))}
            </div>
            <p className="carry-catalog-note">
              {ar
                ? "هذه بطاقات تجريبية فقط. ستظهر منتجاتك الحقيقية هنا بمجرد إضافتها من لوحة الإدارة."
                : "Ces cartes sont des aperçus uniquement. Vos vrais produits les remplaceront dès leur ajout dans l’administration."}
            </p>
          </>
        )}
      </section>
      <div className="carry-benefits carry-container">
        <span>
          <MapPin />
          {ar ? "58 ولاية" : "58 wilayas"}
        </span>
        <span>
          <Banknote />
          {ar ? "الدفع عند الاستلام" : "Payez à la réception"}
        </span>
        <span>
          <PackageCheck />
          {ar ? "اطلب بكل بساطة" : "Une commande, simplement"}
        </span>
      </div>
      <section id="experience" className="carry-story carry-container">
        <div className="carry-story-number">LESS, BUT BETTER.</div>
        <div>
          <p className="carry-eyebrow">L’ESPRIT CARRY</p>
          <h2>
            {ar ? (
              "خذ ما تحتاجه. وانطلق."
            ) : (
              <>
                Emportez l’essentiel.
                <br />
                Laissez place au reste.
              </>
            )}
          </h2>
          <p>
            {ar
              ? "أسلوب واضح، تفاصيل مهمة، وشراء بدون تعقيد. اختر منتجك، املأ معلوماتك وادفع عند الاستلام."
              : "Un style affirmé, une sélection à découvrir, et rien de compliqué. Choisissez votre modèle, renseignez vos coordonnées, payez seulement à la réception."}
          </p>
        </div>
      </section>
      <section id="livraison" className="carry-how carry-container">
        <p className="carry-eyebrow">DE L’ÉCRAN À VOTRE PORTE</p>
        <h2>
          {ar ? "ثلاث خطوات. وانتهى الأمر." : "Trois étapes. C’est tout."}
        </h2>
        <div className="carry-steps">
          {(ar
            ? [
                ["اختر", "اكتشف الصور والتفاصيل والعروض المتاحة."],
                ["اطلب", "أضف اسمك، رقم هاتفك، ولايتك وبلديتك."],
                [
                  "استلم",
                  "رسوم التوصيل واضحة قبل التأكيد. الدفع عند الاستلام.",
                ],
              ]
            : [
                [
                  "Choisissez.",
                  "Les photos, les détails, les offres. Tout est sur la page produit.",
                ],
                [
                  "Commandez.",
                  "Votre nom, votre téléphone, votre wilaya et votre commune.",
                ],
                [
                  "Recevez.",
                  "Les frais sont affichés avant confirmation. Vous payez à la réception.",
                ],
              ]
          ).map(([title, copy], i) => (
            <div key={title}>
              <span className="carry-step-number">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
