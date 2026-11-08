"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Banknote } from "lucide-react";
import { useLang } from "@/components/storefront/lang-provider";
import { ProductDescription } from "@/components/storefront/product-description";
import {
  CheckoutForm,
  type FeeInfo,
} from "@/components/storefront/checkout-form";
import { productImageUrl } from "@/lib/images";
import { formatDZD } from "@/lib/money";
import type { ProductRow } from "@/types/database.types";

export function CarryProduct({
  product,
  feeMap = {},
  preview = false,
}: {
  product: ProductRow;
  feeMap?: Record<number, FeeInfo>;
  preview?: boolean;
}) {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [active, setActive] = useState(0);
  const title = ar ? product.name_ar || product.name_fr : product.name_fr;
  const available = product.stock_quantity - product.reserved_quantity > 0;
  const images = preview
    ? ["/carry-bag.svg", "/carry-bag.svg", "/carry-bag.svg"]
    : product.images.length
      ? product.images.map(productImageUrl)
      : ["/carry-bag.svg"];

  return (
    <div className="carry-container carry-product-page carry-product-simple">
      <Link className="carry-breadcrumb" href="/carry#collection">
        <ArrowLeft size={14} />
        {ar ? "العودة إلى المجموعة" : "Retour à la collection"}
      </Link>
      {preview && (
        <p className="carry-preview-notice">
          {ar
            ? "عرض تجريبي فقط — لا يتم إرسال أي طلب."
            : "Aperçu uniquement — aucune commande ne sera envoyée."}
        </p>
      )}
      <div className="carry-detail-grid">
        <div
          className={`carry-gallery${images.length > 1 ? " carry-gallery-multiple" : ""}`}
        >
          <div className="carry-main-image">
            <Image
              src={images[active] || images[0]}
              alt={title + " — " + (active + 1)}
              fill
              sizes="(max-width: 900px) 100vw, 54vw"
              priority
              data-preview-view={preview ? active : undefined}
            />
            {images.length > 1 && (
              <div className="carry-gallery-controls">
                <button
                  type="button"
                  onClick={() =>
                    setActive((active + images.length - 1) % images.length)
                  }
                  aria-label={ar ? "الصورة السابقة" : "Photo précédente"}
                >
                  <ChevronLeft size={18} />
                </button>
                <span aria-live="polite">
                  {active + 1} / {images.length}
                </span>
                <button
                  type="button"
                  onClick={() => setActive((active + 1) % images.length)}
                  aria-label={ar ? "الصورة التالية" : "Photo suivante"}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div
              className="carry-thumbnails"
              role="group"
              aria-label={ar ? "صور المنتج" : "Photos du produit"}
            >
              {images.map((src, i) => (
                <button
                  key={src + i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-pressed={active === i}
                  aria-label={
                    (ar ? "عرض الصورة " : "Afficher la photo ") + (i + 1)
                  }
                >
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="84px"
                    data-preview-view={preview ? i : undefined}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="carry-product-panel">
          <div className="carry-product-title-price">
            <h1>{title}</h1>
            <div className="carry-price">
              {
                <>
                  {formatDZD(product.price)}
                  {product.compare_at_price &&
                  product.compare_at_price > product.price ? (
                    <del>{formatDZD(product.compare_at_price)}</del>
                  ) : null}
                </>
              }
            </div>
          </div>
          {preview && (
            <p className="carry-example-price-note">
              {ar
                ? "سعر تجريبي فقط · حدد سعر منتجك من لوحة الإدارة"
                : "Prix d’exemple uniquement · Votre prix se règle dans Admin"}
            </p>
          )}
          <p className="carry-cod-note">
            <Banknote size={17} />
            {ar
              ? "الدفع عند الاستلام · بدون بطاقة بنكية"
              : "Payez à la réception · Aucune carte bancaire"}
          </p>
          <section id="order" className="carry-order">
            {preview ? (
              <CarryOrderPreview ar={ar} />
            ) : available ? (
              <CheckoutForm
                productId={product.id}
                price={product.price}
                offers={product.offers}
                deliveryFees={feeMap}
                image={product.images[0]}
                productName={title}
                confirmationBasePath="/carry/commande"
              />
            ) : (
              <p className="carry-sold-message">
                {ar
                  ? "هذا المنتج غير متوفر حاليًا."
                  : "Ce produit est actuellement épuisé."}
                <Link href="/carry#collection">
                  {ar ? "شاهد المجموعة" : "Voir la collection →"}
                </Link>
              </p>
            )}
          </section>
        </div>
      </div>
      {product.description_blocks?.length > 0 && (
        <div className="carry-enriched-description">
          <ProductDescription blocks={product.description_blocks} />
        </div>
      )}
    </div>
  );
}

/** Visual preview only: no submission, leads, tracking or database writes. */
function CarryOrderPreview({ ar }: { ar: boolean }) {
  return (
    <div className="carry-preview-fields">
      <h2>{ar ? "اطلب الآن" : "Commander maintenant"}</h2>
      <label htmlFor="preview-name">
        {ar ? "الاسم الكامل" : "Nom complet"}
      </label>
      <input
        id="preview-name"
        placeholder={ar ? "اسمك" : "Votre nom"}
        autoComplete="off"
      />
      <label htmlFor="preview-phone">
        {ar ? "رقم الهاتف" : "Numéro de téléphone"}
      </label>
      <input
        id="preview-phone"
        type="tel"
        placeholder="05 / 06 / 07…"
        dir="ltr"
        autoComplete="off"
      />
      <div className="carry-preview-location">
        <div>
          <label htmlFor="preview-wilaya">{ar ? "الولاية" : "Wilaya"}</label>
          <select id="preview-wilaya" disabled>
            <option>{ar ? "اختر الولاية" : "Choisir la wilaya"}</option>
          </select>
        </div>
        <div>
          <label htmlFor="preview-commune">{ar ? "البلدية" : "Commune"}</label>
          <select id="preview-commune" disabled>
            <option>{ar ? "اختر البلدية" : "Choisir la commune"}</option>
          </select>
        </div>
      </div>
      <label htmlFor="preview-quantity">{ar ? "الكمية" : "Quantité"}</label>
      <input
        id="preview-quantity"
        type="number"
        min="1"
        max="99"
        defaultValue="1"
      />
      <button className="carry-button" disabled type="button">
        {ar ? "تأكيد الطلب — عرض تجريبي" : "Confirmer la commande — aperçu"}
      </button>
      <p>
        {ar
          ? "الدفع عند الاستلام · النموذج التجريبي غير متصل بالطلبات"
          : "Paiement à la livraison · Démonstration sans envoi"}
      </p>
    </div>
  );
}
