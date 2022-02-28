const esbuild = require("esbuild");

const tsFiles = [
    'popup.ts', 'performance.ts', 'manage.ts',
    'export.ts', 'analyze_overview.ts', 'analyze_favorites.ts',
    'analyze_team.ts'
];

esbuild
  .build({
    entryPoints: tsFiles.map(name => './src/' + name),
    bundle: true,
    minify: true,
    sourcemap: process.env.NODE_ENV !== "production",
    target: ["chrome70", "firefox60"],
    outdir: "./dist/js",
    define: {
      "process.env.NODE_ENV": `"${process.env.NODE_ENV}"`
    }
  })
  .catch(() => process.exit(1));