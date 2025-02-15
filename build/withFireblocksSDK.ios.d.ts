import { ConfigPlugin } from '@expo/config-plugins';
export type IosFireblocksSDKConfig = {
    productName: string;
    repositoryUrl: string;
    minimumVersion: string;
};
declare const withIosFireblocksSDK: ConfigPlugin<IosFireblocksSDKConfig>;
export { withIosFireblocksSDK };
