import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/core/index.ts"],
    outDir: "dist/core",
    name: "doclang-viewer",
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
  },
  {
    entry: ["src/react/index.ts"],
    outDir: "dist/react",
    name: "doclang-viewer-react",
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ["react", "react-dom"],
  },
  {
    entry: ["src/angular/index.ts"],
    outDir: "dist/angular",
    name: "doclang-viewer-angular",
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ["@angular/core"],
  },
]);
