import { ConfigPlugin } from '@expo/config-plugins';
export type AndroidFireblocksSDKConfig = {
    sdkVersion: string;
};
declare const withAndroidFireblocksSDK: ConfigPlugin<AndroidFireblocksSDKConfig>;
export { withAndroidFireblocksSDK };
