# @alexdevs/expo-fireblocks-config-plugin

Expo is an open-source framework for apps that run natively on Android, iOS, and the web.

This project cannot be used with an [Expo Go](https://docs.expo.dev/workflow/expo-go/) app because it requires custom native code. Follow the steps in the ["Adding custom native code"](https://docs.expo.dev/workflow/customizing/) guide to create your own development build or prebuild your native projects.

This plugin automatically configures your native code when it's generated (e.g. with `npx expo prebuild`) so that it can be used with [fireblocks-ncw-sdk](https://github.com/fireblocks/react-native-ncw-sdk).

## Expo Installation

Install the required packages:
```sh
npx expo install expo-build-properties @alexdevs/expo-fireblocks-config-plugin @fireblocks/react-native-ncw-sdk
```

After installing these packages, add the [config plugins](https://docs.expo.dev/guides/config-plugins/) to the [`plugins`](https://docs.expo.dev/versions/latest/config/app/#plugins) array in your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "minSdkVersion": 27,
            "extraMavenRepos": [
              {
                "url": "https://maven.fireblocks.io/android-sdk/maven",
                "credentials": {
                  "name": "Deploy-Token",
                  "value": "-fU8ijmuPohHaqDBgpaT"
                },
                "authentication": "header"
              }
            ]
          }
        }
      ],
      [
        "@alexdevs/expo-fireblocks-config-plugin",
        {
          "ios": {
            "productName": "FireblocksSDK",
            "repositoryUrl": "https://github.com/fireblocks/ncw-ios-sdk",
            "minimumVersion": "2.9.1"
          },
          "android": {
            "sdkVersion": "2.5.0"
          }
        }
      ]
    ]
  }
}
```

### Configuration Options

#### iOS Configuration
- `productName`: The name of the Swift package product to use (default: "FireblocksSDK")
- `repositoryUrl`: The URL of the Swift package repository containing the iOS SDK
- `minimumVersion`: The minimum version of the SDK to use (current latest: 2.9.1)

#### Android Configuration
- `sdkVersion`: The version of the Android SDK to use (current latest: 2.5.0)

> **Note:** The configuration values shown above are taken from the [official Fireblocks documentation](https://ncw-developers.fireblocks.com/docs/setup-4).

> **Tested against Expo SDK 52**  
> This package cannot be used in the "Expo Go" app because it requires custom native code.

## Requirements

### Android
- Minimum SDK version: 27 or higher
- Maven repository access with Deploy-Token authentication (configured via expo-build-properties plugin)

## Expo Build

After installing all dependencies, rebuild your app as described in the ["Adding custom native code"](https://docs.expo.dev/workflow/customizing/) guide.

## Troubleshooting

### iOS
> **Duplicated Signature issue with Xcode 15**  
> This issue is caused by a bug in Xcode 15.0.0. Refer to the [CocoaPods issue](https://github.com/CocoaPods/CocoaPods/issues/12022) for more details.

### Android
> **Maven Repository Access**  
> If you encounter issues accessing the Maven repository:
> 1. Ensure you're using the correct Maven repository URL and credentials as specified in the [Fireblocks documentation](https://ncw-developers.fireblocks.com/docs/setup-4#android-sdk-installation)
> 2. Check that the Deploy-Token is correctly set in your expo-build-properties configuration
> 3. Verify that the SDK version specified is available in the repository
> 4. Make sure your app's minSdkVersion is set to 27 or higher in the expo-build-properties configuration
