const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable .cjs extension support for older commonjs modules inside node_modules (e.g. Firebase)
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs'];

module.exports = config;
