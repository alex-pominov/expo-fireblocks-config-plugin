import { version } from '../package.json';
import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';
import { IosFireblocksSDKConfig, withIosFireblocksSDK } from './withFireblocksSDK.ios';
import { AndroidFireblocksSDKConfig, withAndroidFireblocksSDK } from './withFireblocksSDK.android';

export type FireblocksSDKConfig = {
  android?: AndroidFireblocksSDKConfig;
  ios?: IosFireblocksSDKConfig;
};

const withFireblocksSDK: ConfigPlugin<FireblocksSDKConfig> = (config, pluginConfig = {}) => {
  // Apply Android configuration if provided
  if (pluginConfig.android) {
    config = withAndroidFireblocksSDK(config, pluginConfig.android);
  }

  // Apply iOS configuration if provided
  if (pluginConfig.ios) {
    config = withIosFireblocksSDK(config, pluginConfig.ios);
  }

  return config;
};

module.exports = createRunOncePlugin(withFireblocksSDK, 'withFireblocksSDK', version);
