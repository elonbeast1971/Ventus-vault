const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Prevent Metro from scanning the stray Ventus-Vault folder which can
// introduce Windows backslashes into auto-generated regexes and break
// the bundler on Windows. Blocking it here avoids the invalid regex.
config.resolver = {
  ...config.resolver,
  blockList: exclusionList([
    /.*\\Ventus-Vault\\.*/,
    /.*\/Ventus-Vault\/.*/,
  ]),
};

module.exports = config;
