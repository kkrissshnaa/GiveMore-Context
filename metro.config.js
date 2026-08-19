const { getDefaultConfig } = require("expo/metro-config");
const { withNativewind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

const path = require("path");
const fs = require("fs");
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@clerk/react')) {
    const subpath = moduleName.replace('@clerk/react', '').replace(/^\//, '');
    const filename = subpath ? `${subpath}.cjs` : 'index.cjs';
    const resolvedPath = path.resolve(__dirname, 'node_modules/@clerk/react/dist', filename);
    return {
      type: 'sourceFile',
      filePath: resolvedPath,
    };
  }
  if (moduleName.startsWith('@clerk/shared/')) {
    const subpath = moduleName.replace('@clerk/shared/', '');
    const candidateFile = path.resolve(__dirname, 'node_modules/@clerk/shared/dist', `${subpath}.js`);
    const candidateIndex = path.resolve(__dirname, 'node_modules/@clerk/shared/dist', subpath, 'index.js');
    if (fs.existsSync(candidateFile)) {
      return { type: 'sourceFile', filePath: candidateFile };
    }
    if (fs.existsSync(candidateIndex)) {
      return { type: 'sourceFile', filePath: candidateIndex };
    }
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativewind(config);