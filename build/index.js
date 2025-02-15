"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const package_json_1 = require("../package.json");
const config_plugins_1 = require("@expo/config-plugins");
const withFireblocksSDK_ios_1 = require("./withFireblocksSDK.ios");
const withFireblocksSDK_android_1 = require("./withFireblocksSDK.android");
const withFireblocksSDK = (config, pluginConfig = {}) => {
    // Apply Android configuration if provided
    if (pluginConfig.android) {
        config = (0, withFireblocksSDK_android_1.withAndroidFireblocksSDK)(config, pluginConfig.android);
    }
    // Apply iOS configuration if provided
    if (pluginConfig.ios) {
        config = (0, withFireblocksSDK_ios_1.withIosFireblocksSDK)(config, pluginConfig.ios);
    }
    return config;
};
module.exports = (0, config_plugins_1.createRunOncePlugin)(withFireblocksSDK, 'withFireblocksSDK', package_json_1.version);
