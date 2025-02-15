"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidFireblocksSDK = void 0;
// /withAndroidFireblocksSDK.ts
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const withFireblocksSettingsGradle = (config, androidFireblocksSDKConfig) => {
    return (0, config_plugins_1.withProjectBuildGradle)(config, (config) => {
        if (config.modResults.contents.includes(androidFireblocksSDKConfig.mavenRepository.url)) {
            return config;
        }
        // Inject only the maven block instead of wrapping it in a new repositories block.
        const mavenRepositoryConfig = `
        maven {
            url "${androidFireblocksSDKConfig.mavenRepository.url}"
            name = "${androidFireblocksSDKConfig.mavenRepository.name}"
            credentials(HttpHeaderCredentials) {
                name = "${androidFireblocksSDKConfig.mavenRepository.credentials.name}"
                value = "${androidFireblocksSDKConfig.mavenRepository.credentials.value}"
            }
            authentication {
                header(HttpHeaderAuthentication)
            }
        }
    `;
        const mergeResult = (0, generateCode_1.mergeContents)({
            tag: 'fireblocks-sdk-maven',
            src: config.modResults.contents,
            newSrc: mavenRepositoryConfig,
            // Locate the 'repositories {' block inside the allprojects block.
            anchor: /allprojects\s*\{[\s\S]*?repositories\s*\{/,
            offset: 1,
            comment: '//',
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
const withFireblocksAppBuildGradle = (config, androidFireblocksSDKConfig) => {
    return (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        const buildGradleContents = `    implementation("com.fireblocks.sdk:ncw:${androidFireblocksSDKConfig.sdkVersion}")`;
        if (config.modResults.contents.includes('com.fireblocks.sdk')) {
            return config;
        }
        const mergeResult = (0, generateCode_1.mergeContents)({
            tag: 'fireblocks-sdk-dependency',
            src: config.modResults.contents,
            newSrc: buildGradleContents,
            anchor: /dependencies\s*{/,
            offset: 1,
            comment: '//',
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
    // config = withFireblocksSettingsGradle(config, androidFireblocksSDKConfig);
    config = withFireblocksAppBuildGradle(config, androidFireblocksSDKConfig);
    return config;
};
exports.withAndroidFireblocksSDK = withAndroidFireblocksSDK;
