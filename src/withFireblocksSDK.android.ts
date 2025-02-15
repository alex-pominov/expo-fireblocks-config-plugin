import { ConfigPlugin, withAppBuildGradle } from '@expo/config-plugins';
import { mergeContents } from '@expo/config-plugins/build/utils/generateCode';

export type AndroidFireblocksSDKConfig = {
  sdkVersion: string;
};

const withFireblocksAppBuildGradle: ConfigPlugin<AndroidFireblocksSDKConfig> = (config, androidFireblocksSDKConfig) => {
  return withAppBuildGradle(config, (config) => {
    const buildGradleContents = `    implementation "com.fireblocks.sdk:ncw:${androidFireblocksSDKConfig.sdkVersion}"`;

    if (config.modResults.contents.includes('com.fireblocks.sdk')) {
      return config;
    }

    const mergeResult = mergeContents({
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

const withAndroidFireblocksSDK: ConfigPlugin<AndroidFireblocksSDKConfig> = (config, androidFireblocksSDKConfig) => {
  return withFireblocksAppBuildGradle(config, androidFireblocksSDKConfig);
};

export { withAndroidFireblocksSDK };
