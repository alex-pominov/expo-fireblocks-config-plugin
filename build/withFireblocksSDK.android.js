"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidFireblocksSDK = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const withFireblocksAppBuildGradle = (config, androidFireblocksSDKConfig) => {
    return (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        const buildGradleContents = `    implementation "com.fireblocks.sdk:ncw:${androidFireblocksSDKConfig.sdkVersion}"`;
        if (config.modResults.contents.includes('com.fireblocks.sdk')) {
            return config;
        }
        const mergeResult = (0, generateCode_1.mergeContents)({
            anchor: /dependencies\s*{/,
            comment: '//',
            newSrc: buildGradleContents,
            offset: 1,
            src: config.modResults.contents,
            tag: 'fireblocks-sdk-dependency',
        });
        return {
            ...config,
            modResults: {
                ...config.modResults,
                contents: mergeResult.contents,
            },
        };
    });
};
const withAndroidFireblocksSDK = (config, androidFireblocksSDKConfig) => {
    return withFireblocksAppBuildGradle(config, androidFireblocksSDKConfig);
};
exports.withAndroidFireblocksSDK = withAndroidFireblocksSDK;
