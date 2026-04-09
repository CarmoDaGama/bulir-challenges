const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig(__dirname);
const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  cacheVersion: 'mobile',
  // Force Metro to resolve static assets relative to this app folder.
  projectRoot: __dirname,
  transformer: {
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    assetExts: assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...sourceExts, 'cjs', 'mjs', 'svg'],
  },
};

const nxMetroConfig = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Change this to true to see debugging info.
  // Useful if you have issues resolving modules
  debug: false,
  // all the file extensions used for imports other than 'ts', 'tsx', 'js', 'jsx', 'json'
  extensions: [],
});

// Nx sets projectRoot to the workspace root; force it back to this app so Expo
// static assets declared in app.json resolve from apps/mobile/assets.
nxMetroConfig.projectRoot = __dirname;
nxMetroConfig.watchFolders = Array.from(
  new Set([...(defaultConfig.watchFolders ?? []), ...(nxMetroConfig.watchFolders ?? [])])
);
nxMetroConfig.resolver.nodeModulesPaths = Array.from(
  new Set([...(defaultConfig.resolver?.nodeModulesPaths ?? []), ...(nxMetroConfig.resolver?.nodeModulesPaths ?? [])])
);

module.exports = nxMetroConfig;
