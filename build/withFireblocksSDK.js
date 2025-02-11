"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const package_json_1 = require("../package.json");
const config_plugins_1 = require("@expo/config-plugins");
/**
 * Generate a random Xcode-style UUID (24 uppercase hex characters).
 */
function generateRandomProjectUUID() {
    return [...Array(24)]
        .map(() => Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase())
        .join('');
}
/**
 * Attempt to find the Frameworks Build Phase UUID in the project if one isn't
 * provided via config.
 */
function getFrameworksBuildPhaseUUID(xcodeProject) {
    const phases = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase;
    for (const uuid in phases) {
        const phase = phases[uuid];
        if (phase.isa === 'PBXFrameworksBuildPhase') {
            return uuid;
        }
    }
    throw new Error('Unable to locate PBXFrameworksBuildPhase in the Xcode project.');
}
function withFireblocksDependency(config, fireblocksSDKConfig) {
    return (0, config_plugins_1.withXcodeProject)(config, async (config) => {
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
            version: fireblocksSDKConfig.version,
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
function addSwiftPackageReference(xcodeProject, { packageRefUuid, repositoryUrl, version }) {
    // Create/extend the project section's packageReferences
    const projectUuid = xcodeProject.getFirstProject().uuid;
    const projectSection = xcodeProject.pbxProjectSection()[projectUuid];
    projectSection.packageReferences = projectSection.packageReferences || [];
    const existingRef = projectSection.packageReferences.find((ref) => ref.comment === 'XCRemoteSwiftPackageReference "ncw-ios-sdk"');
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
function addPackageProductDependency(xcodeProject, { packageRefUuid, productName, productRefUuid, }) {
    // Create/extend XCSwiftPackageProductDependency
    const productDepSection = xcodeProject.hash.project.objects.XCSwiftPackageProductDependency || {};
    productDepSection[productRefUuid] = {
        isa: 'XCSwiftPackageProductDependency',
        package: packageRefUuid,
        productName,
    };
    xcodeProject.hash.project.objects.XCSwiftPackageProductDependency = productDepSection;
}
function addBuildFileEntry(xcodeProject, { buildFileUuid, productRefUuid }) {
    // Create/extend PBXBuildFile
    const buildFileSection = xcodeProject.hash.project.objects.PBXBuildFile || {};
    buildFileSection[buildFileUuid] = {
        isa: 'PBXBuildFile',
        productRef: productRefUuid, // For SPM products, use productRef instead of fileRef
    };
    xcodeProject.hash.project.objects.PBXBuildFile = buildFileSection;
}
function findMainTarget(xcodeProject, config) {
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
function addToFrameworksBuildPhase(xcodeProject, { buildFileUuid, frameworksBuildPhaseUuid }) {
    // Retrieve the Frameworks build phase object
    const frameworksBuildPhase = xcodeProject.hash.project.objects.PBXFrameworksBuildPhase[frameworksBuildPhaseUuid];
    if (!frameworksBuildPhase) {
        throw new Error('Could not find the specified Frameworks build phase.');
    }
    frameworksBuildPhase.files = frameworksBuildPhase.files || [];
    const existsInBuildPhase = frameworksBuildPhase.files.find((file) => file.value === buildFileUuid);
    if (!existsInBuildPhase) {
        frameworksBuildPhase.files.push({
            comment: 'FireblocksSDK in Frameworks',
            value: buildFileUuid,
        });
    }
}
function withPostInstall(config) {
    return (0, config_plugins_1.withDangerousMod)(config, [
        'ios',
        async (config) => {
            const podfilePath = path_1.default.join(config.modRequest.platformProjectRoot, 'Podfile');
            if (!fs_1.default.existsSync(podfilePath)) {
                return config;
            }
            let podfileContent = fs_1.default.readFileSync(podfilePath, 'utf8');
            const postInstallRegex = /post_install do \|installer\|/;
            if (postInstallRegex.test(podfileContent) && !podfileContent.includes('$RNNCWSDK.post_install(installer)')) {
                podfileContent = podfileContent.replace(postInstallRegex, (match) => {
                    // Inject the SDK post_install hook right after the post_install declaration
                    return `${match}\n\t$RNNCWSDK.post_install(installer)`;
                });
                fs_1.default.writeFileSync(podfilePath, podfileContent, 'utf8');
            }
            return config;
        },
    ]);
}
const withFireblocksSDK = (config, { productName, repositoryUrl, version }) => {
    config = withFireblocksDependency(config, { productName, repositoryUrl, version });
    config = withPostInstall(config);
    return config;
};
module.exports = (0, config_plugins_1.createRunOncePlugin)(withFireblocksSDK, 'withFireblocksSDK', package_json_1.version);
