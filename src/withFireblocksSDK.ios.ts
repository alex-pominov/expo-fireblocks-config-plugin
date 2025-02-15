import fs from 'fs';
import path from 'path';
import { ExpoConfig } from '@expo/config-types';
import { ExportedConfigWithProps } from '@expo/config-plugins/build/Plugin.types';
import { ConfigPlugin, XcodeProject, withDangerousMod, withXcodeProject } from '@expo/config-plugins';

export type IosFireblocksSDKConfig = {
  productName: string;
  repositoryUrl: string;
  minimumVersion: string;
};

/**
 * Generate a random Xcode-style UUID (24 uppercase hex characters).
 */
function generateRandomProjectUUID() {
  return [...Array(24)]
    .map(() =>
      Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase(),
    )
    .join('');
}

/**
 * Attempt to find the Frameworks Build Phase UUID in the project if one isn't
 * provided via config.
 */
function getFrameworksBuildPhaseUUID(xcodeProject: XcodeProject) {
  const phases = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase;
  for (const uuid in phases) {
    const phase = phases[uuid];
    if (phase.isa === 'PBXFrameworksBuildPhase') {
      return uuid;
    }
  }
  throw new Error('Unable to locate PBXFrameworksBuildPhase in the Xcode project.');
}

function withFireblocksDependency(config: ExpoConfig, fireblocksSDKConfig: IosFireblocksSDKConfig) {
  return withXcodeProject(config, async (config) => {
    const xcodeProject = config.modResults;
    const frameworksBuildPhaseUuid = getFrameworksBuildPhaseUUID(xcodeProject);

    // Generate random UUIDs for each usage.
    const buildFileUuid = generateRandomProjectUUID();
    const packageRefUuid = generateRandomProjectUUID();
    const productRefUuid = generateRandomProjectUUID();

    // 1. Add Swift Package Reference
    addSwiftPackageReference(xcodeProject, {
      packageRefUuid,
      repositoryUrl: fireblocksSDKConfig.repositoryUrl,
      version: fireblocksSDKConfig.minimumVersion,
    });

    // 2. Add Package Product Dependency
    addPackageProductDependency(xcodeProject, {
      packageRefUuid,
      productName: fireblocksSDKConfig.productName,
      productRefUuid,
    });

    // 3. Add Build File Entry
    addBuildFileEntry(xcodeProject, { buildFileUuid, productRefUuid });

    // 4. Find Main Target
    const { mainTarget } = findMainTarget(xcodeProject, config);
    if (!mainTarget) {
      throw new Error('Could not find the main application target.');
    }

    // 5. Add to Frameworks Build Phase
    addToFrameworksBuildPhase(xcodeProject, {
      buildFileUuid,
      frameworksBuildPhaseUuid,
    });

    return config;
  });
}

function addSwiftPackageReference(
  xcodeProject: XcodeProject,
  { packageRefUuid, repositoryUrl, version }: { packageRefUuid: string; repositoryUrl: string; version: string },
) {
  // Create/extend the project section's packageReferences
  const projectUuid = xcodeProject.getFirstProject().uuid;
  const projectSection = xcodeProject.pbxProjectSection()[projectUuid];
  projectSection.packageReferences = projectSection.packageReferences || [];

  const existingRef = projectSection.packageReferences.find(
    (ref: { comment: string }) => ref.comment === 'XCRemoteSwiftPackageReference "ncw-ios-sdk"',
  );
  if (!existingRef) {
    projectSection.packageReferences.push({
      comment: 'XCRemoteSwiftPackageReference "ncw-ios-sdk"',
      value: packageRefUuid,
    });
  }

  // Create/extend XCRemoteSwiftPackageReference
  const remoteRefSection = xcodeProject.hash.project.objects.XCRemoteSwiftPackageReference || {};
  remoteRefSection[packageRefUuid] = {
    isa: 'XCRemoteSwiftPackageReference',
    repositoryURL: repositoryUrl,
    requirement: {
      kind: 'upToNextMajorVersion',
      minimumVersion: version,
    },
  };
  xcodeProject.hash.project.objects.XCRemoteSwiftPackageReference = remoteRefSection;
}

function addPackageProductDependency(
  xcodeProject: XcodeProject,
  {
    packageRefUuid,
    productName,
    productRefUuid,
  }: { packageRefUuid: string; productName: string; productRefUuid: string },
) {
  // Create/extend XCSwiftPackageProductDependency
  const productDepSection = xcodeProject.hash.project.objects.XCSwiftPackageProductDependency || {};
  productDepSection[productRefUuid] = {
    isa: 'XCSwiftPackageProductDependency',
    package: packageRefUuid,
    productName,
  };
  xcodeProject.hash.project.objects.XCSwiftPackageProductDependency = productDepSection;
}

function addBuildFileEntry(
  xcodeProject: XcodeProject,
  { buildFileUuid, productRefUuid }: { buildFileUuid: string; productRefUuid: string },
) {
  // Create/extend PBXBuildFile
  const buildFileSection = xcodeProject.hash.project.objects.PBXBuildFile || {};
  buildFileSection[buildFileUuid] = {
    isa: 'PBXBuildFile',
    productRef: productRefUuid, // For SPM products, use productRef instead of fileRef
  };
  xcodeProject.hash.project.objects.PBXBuildFile = buildFileSection;
}

function findMainTarget(xcodeProject: XcodeProject, config: ExportedConfigWithProps) {
  const nativeTargets = xcodeProject.pbxNativeTargetSection();
  const projectName = config.modRequest.projectName;

  for (const uuid in nativeTargets) {
    const target = nativeTargets[uuid];
    if (target.name === projectName && target.productType === '"com.apple.product-type.application"') {
      return { mainTarget: target, targetUuid: uuid };
    }
  }
  return { mainTarget: null, targetUuid: null };
}

function addToFrameworksBuildPhase(
  xcodeProject: XcodeProject,
  { buildFileUuid, frameworksBuildPhaseUuid }: { buildFileUuid: string; frameworksBuildPhaseUuid: string },
) {
  // Retrieve the Frameworks build phase object
  const frameworksBuildPhase = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[frameworksBuildPhaseUuid];
  if (!frameworksBuildPhase) {
    throw new Error('Could not find the specified Frameworks build phase.');
  }

  frameworksBuildPhase.files = frameworksBuildPhase.files || [];
  const existsInBuildPhase = frameworksBuildPhase.files.find((file: { value: string }) => file.value === buildFileUuid);

  if (!existsInBuildPhase) {
    frameworksBuildPhase.files.push({
      comment: 'FireblocksSDK in Frameworks',
      value: buildFileUuid,
    });
  }
}

function withPostInstall(config: ExpoConfig) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');

      if (!fs.existsSync(podfilePath)) {
        return config;
      }

      let podfileContent = fs.readFileSync(podfilePath, 'utf8');
      const postInstallRegex = /post_install do \|installer\|/;

      if (postInstallRegex.test(podfileContent) && !podfileContent.includes('$RNNCWSDK.post_install(installer)')) {
        podfileContent = podfileContent.replace(postInstallRegex, (match) => {
          // Inject the SDK post_install hook right after the post_install declaration
          return `${match}\n\t$RNNCWSDK.post_install(installer)`;
        });
        fs.writeFileSync(podfilePath, podfileContent, 'utf8');
      }
      return config;
    },
  ]);
}

const withIosFireblocksSDK: ConfigPlugin<IosFireblocksSDKConfig> = (config, iosFireblocksSDKConfig) => {
  config = withFireblocksDependency(config, iosFireblocksSDKConfig);
  config = withPostInstall(config);
  return config;
};

export { withIosFireblocksSDK };
