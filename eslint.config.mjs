import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Intentional: product, category, store and logo photos are pasted or uploaded by admins and can live on any host
    // (Supabase storage, Google, Unsplash...), plus local blob previews. next/image would need every host allow-listed
    // in next.config and breaks the image outright for any host that isn't, so plain <img> is kept.
    rules: { "@next/next/no-img-element": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
