/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  assetsBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "build",
  serverBuildPath: "build/index.js",
  ignoredRouteFiles: [".*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  watchPaths: ["./prisma/schema.prisma"],
  serverDependenciesToBundle: [
    "react",
    "react-dom",
    /^react-dom\/.*/,
    "dotenv",  // Add dotenv to the list of server dependencies to bundle
  ],
  serverModuleFormat: "cjs",  // Use CommonJS
  tailwind: true,
  postcss: true,
};