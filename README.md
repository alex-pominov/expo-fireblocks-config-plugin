# @alexdevs/expo-fireblocks-config-plugin

Expo is an open-source framework for apps that run natively on Android, iOS, and the web.

**Note:** This plugin currently supports **iOS only**. Android support is not yet available. If you need Android support or have any questions, feel free to contact me.

This project cannot be used with an [Expo Go](https://docs.expo.dev/workflow/expo-go/) app because it requires custom native code. Follow the steps in the ["Adding custom native code"](https://docs.expo.dev/workflow/customizing/) guide to create your own development build or prebuild your native projects.

This plugin automatically configures your native code when it's generated (e.g. with `npx expo prebuild`) so that it can be used with [fireblocks-sdk-js](https://github.com/fireblocks/fireblocks-sdk-js).

## Expo Installation

Install the required packages:

Using npm:
```sh
npm install @fireblocks/react-native-ncw-sdk --save
npm install @alexdevs/expo-fireblocks-config-plugin --only=dev
```

Or using yarn:
```sh
yarn add @fireblocks/react-native-ncw-sdk
yarn add @alexdevs/expo-fireblocks-config-plugin --dev
```

After installing these packages, add the [config plugin](https://docs.expo.dev/guides/config-plugins/) to the [`plugins`](https://docs.expo.dev/versions/latest/config/app/#plugins) array in your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "@alexdevs/expo-fireblocks-config-plugin",
        {
          "productName": "FireblocksSDK",
          "repositoryUrl": "https://github.com/fireblocks/ncw-ios-sdk",
          "version": "2.9.1"
        }
      ]
    ]
  }
}
```

> **Tested against Expo SDK 52**  
> This package cannot be used in the "Expo Go" app because it requires custom native code.

## Expo Build

After installing all dependencies, rebuild your app as described in the ["Adding custom native code"](https://docs.expo.dev/workflow/customizing/) guide.

## Troubleshooting

> **Duplicated Signature issue with Xcode 15**  
> This issue is caused by a bug in Xcode 15.0.0. Refer to the [CocoaPods issue](https://github.com/CocoaPods/CocoaPods/issues/12022) for more details.
