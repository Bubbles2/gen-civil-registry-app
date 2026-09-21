// React Native CLI project config.
//
// The manifests no longer carry `package=` (AGP 8 rejects it; the namespace
// lives in android/app/build.gradle). RN 0.70's CLI still greps the manifest
// for it unless told the package name here. CLI 10+ (RN 0.71) reads the
// namespace itself, at which point this entry becomes redundant but harmless.
module.exports = {
  project: {
    android: {
      packageName: 'com.crseneagalmobile',
      // Arguments the Metro `a` key passes to `run-android`. Without these the
      // bare command fails (`installDebug` is ambiguous across the four product
      // flavors) and spawns a second Metro on 8081 instead of using ours on 3000.
      // Keep in sync with the `android:dev` script in package.json.
      watchModeCommandParams: ['--mode', 'devDebug', '--appIdSuffix', 'dev', '--port', '3000'],
    },
  },
};
