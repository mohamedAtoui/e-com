import test from "node:test";
import assert from "node:assert/strict";
import {
  imageUploadSize,
  prepareImageUpload,
  IMAGE_CACHE_CONTROL,
} from "../lib/image-upload.ts";

test("large product photos are resized proportionally and never enlarged", () => {
  assert.deepEqual(imageUploadSize(4000, 3000, "product"), {
    width: 1600,
    height: 1200,
  });
  assert.deepEqual(imageUploadSize(3000, 6000, "product"), {
    width: 1000,
    height: 2000,
  });
  assert.deepEqual(imageUploadSize(400, 300, "product"), {
    width: 400,
    height: 300,
  });
});
test("long enriched descriptions remain readable", () => {
  assert.deepEqual(imageUploadSize(768, 10000, "description"), {
    width: 768,
    height: 10000,
  });
  assert.deepEqual(imageUploadSize(2560, 10000, "description"), {
    width: 1280,
    height: 5000,
  });
  assert.throws(() => imageUploadSize(0, 20, "product"));
});
test("uploads reject unsupported or excessive input before decoding", async () => {
  await assert.rejects(
    prepareImageUpload(new File(["x"], "x.svg", { type: "image/svg+xml" })),
    /JPG/,
  );
  await assert.rejects(
    prepareImageUpload({ type: "image/jpeg", size: 26 * 1024 * 1024 }),
    /25 Mo/,
  );
  assert.equal(IMAGE_CACHE_CONTROL, "31536000");
});
test("compresses and resizes BEFORE upload, releasing the bitmap", async () => {
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  let closed = false;
  let drawn;
  globalThis.createImageBitmap = async () => ({
    width: 4000,
    height: 3000,
    close() {
      closed = true;
    },
  });
  globalThis.document = {
    createElement() {
      return {
        getContext() {
          return {
            drawImage(...args) {
              drawn = args.slice(1);
            },
          };
        },
        toBlob(callback, type) {
          callback(new Blob(["compressed"], { type }));
        },
      };
    },
  };
  try {
    const result = await prepareImageUpload(
      new File(["a".repeat(200)], "large.jpg", { type: "image/jpeg" }),
    );
    assert.equal(result.type, "image/webp");
    assert.equal(result.name, "large.webp");
    assert.deepEqual(drawn, [0, 0, 1600, 1200]);
    assert.equal(closed, true);
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});
test("encoding failures are surfaced and always release bitmap memory", async () => {
  const previousBitmap = globalThis.createImageBitmap;
  const previousDocument = globalThis.document;
  let closed = false;
  globalThis.createImageBitmap = async () => ({
    width: 400,
    height: 300,
    close() {
      closed = true;
    },
  });
  globalThis.document = {
    createElement() {
      return {
        getContext() {
          return { drawImage() {} };
        },
        toBlob(callback) {
          callback(null);
        },
      };
    },
  };
  try {
    await assert.rejects(
      prepareImageUpload(new File(["a"], "small.jpg", { type: "image/jpeg" })),
      /compression/,
    );
    assert.equal(closed, true);
  } finally {
    globalThis.createImageBitmap = previousBitmap;
    globalThis.document = previousDocument;
  }
});
