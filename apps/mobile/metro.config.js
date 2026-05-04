const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Monorepo: watch the whole workspace
config.watchFolders = [workspaceRoot];

// Monorepo: resolve from workspace root first, then project root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Native-only packages that must be stubbed on web
const WEB_STUBS = [
  "expo-task-manager",
  "expo-av",
  "expo-sqlite",
  "expo-file-system",
  "react-native-maps",
];

// context.resolveRequest is Metro's BASE resolver — it does NOT include
// Expo CLI's react-native → react-native-web alias. We must add it manually.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web") {
    // Alias the react-native package to react-native-web
    if (moduleName === "react-native" || moduleName === "react-native/index" || moduleName === "react-native/index.js") {
      return context.resolveRequest(context, "react-native-web", platform);
    }

    // Stub out react-native subpath internals that have no web equivalent
    if (moduleName.startsWith("react-native/")) {
      return { type: "sourceFile", filePath: path.resolve(projectRoot, "src/stubs/empty.js") };
    }

    // expo-location: use a real browser geolocation shim
    if (moduleName === "expo-location" || moduleName.startsWith("expo-location/")) {
      return { type: "sourceFile", filePath: path.resolve(projectRoot, "src/stubs/location.web.js") };
    }

    // Stub other native-only Expo modules
    if (WEB_STUBS.some((m) => moduleName === m || moduleName.startsWith(m + "/"))) {
      return { type: "sourceFile", filePath: path.resolve(projectRoot, "src/stubs/empty.js") };
    }
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
