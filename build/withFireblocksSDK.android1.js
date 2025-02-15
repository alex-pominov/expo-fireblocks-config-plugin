"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withAndroidFireblocksSDK = void 0;
const config_plugins_1 = require("@expo/config-plugins");
const generateCode_1 = require("@expo/config-plugins/build/utils/generateCode");
const withFireblocksSettingsGradle = (config, androidFireblocksSDKConfig) => {
    return (0, config_plugins_1.withSettingsGradle)(config, (config) => {
        const hasRepositoriesBlock = /repositories\s*{/.test(config.modResults.contents);
        const hasFireblocksRepo = config.modResults.contents.includes(androidFireblocksSDKConfig.mavenRepository.url);
        if (hasFireblocksRepo) {
            return config;
        }
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
        let mergeResult;
        if (hasRepositoriesBlock) {
            mergeResult = (0, generateCode_1.mergeContents)({
                tag: 'fireblocks-sdk-maven',
                src: config.modResults.contents,
                newSrc: mavenRepositoryConfig,
                anchor: /repositories\s*{/,
                offset: 1,
                comment: '//',
            });
        }
        else {
            const fullRepositoriesBlock = `
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.PREFER_PROJECT)
    repositories {
        ${mavenRepositoryConfig}
    }
}`;
            mergeResult = (0, generateCode_1.mergeContents)({
                tag: 'fireblocks-sdk-maven',
                src: config.modResults.contents,
                newSrc: fullRepositoriesBlock,
                anchor: /dependencyResolutionManagement/,
                offset: 0,
                comment: '//',
            });
        }
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
    // First, update gradle properties
    config = (0, config_plugins_1.withGradleProperties)(config, (config) => {
        const filteredResults = config.modResults.filter((item) => !(item.type === 'property' && item.key.includes('fireblocks')));
        return {
            ...config,
            modResults: [
                ...filteredResults,
                {
                    type: 'property',
                    key: 'fireblocksSdkVersion',
                    value: androidFireblocksSDKConfig.sdkVersion,
                }
            ]
        };
    });
    // Then, update build.gradle
    return (0, config_plugins_1.withAppBuildGradle)(config, (config) => {
        const buildGradleContents = `    implementation "com.fireblocks.sdk:ncw:${androidFireblocksSDKConfig.sdkVersion}"`;
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
    config = withFireblocksSettingsGradle(config, androidFireblocksSDKConfig);
    config = withFireblocksAppBuildGradle(config, androidFireblocksSDKConfig);
    return config;
};
exports.withAndroidFireblocksSDK = withAndroidFireblocksSDK;
