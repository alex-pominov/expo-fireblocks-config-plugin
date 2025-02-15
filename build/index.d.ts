import { IosFireblocksSDKConfig } from './withFireblocksSDK.ios';
import { AndroidFireblocksSDKConfig } from './withFireblocksSDK.android';
export type FireblocksSDKConfig = {
    android?: AndroidFireblocksSDKConfig;
    ios?: IosFireblocksSDKConfig;
};
