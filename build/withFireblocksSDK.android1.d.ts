import { ConfigPlugin } from '@expo/config-plugins';
export type AndroidFireblocksSDKConfig = {
    mavenRepository: {
        url: string;
        name: string;
        credentials: {
            name: string;
            value: string;
        };
    };
    sdkVersion: string;
};
declare const withAndroidFireblocksSDK: ConfigPlugin<AndroidFireblocksSDKConfig>;
export { withAndroidFireblocksSDK };
