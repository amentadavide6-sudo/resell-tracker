const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
if (!fs.existsSync(gradlePath)) {
  console.log('android/app/build.gradle not found, skipping signing setup.');
  process.exit(0);
}

// 1. Write release.jks if ANDROID_KEYSTORE_BASE64 is present
const keystoreBase64 = process.env.ANDROID_KEYSTORE_BASE64;
if (keystoreBase64) {
  const keystoreDest = path.join(__dirname, '..', 'android', 'app', 'release.jks');
  fs.writeFileSync(keystoreDest, Buffer.from(keystoreBase64, 'base64'));
  console.log('Successfully wrote release.jks to', keystoreDest);
}

// 2. Patch android/app/build.gradle
let gradle = fs.readFileSync(gradlePath, 'utf8');

const targetBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }`;

const replacementBlock = `    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (file('release.jks').exists()) {
                storeFile file('release.jks')
                storePassword System.getenv("ANDROID_KEYSTORE_PASSWORD")
                keyAlias System.getenv("ANDROID_KEY_ALIAS")
                keyPassword System.getenv("ANDROID_KEY_PASSWORD")
            }
        }
    }`;

if (gradle.includes(targetBlock)) {
  gradle = gradle.replace(targetBlock, replacementBlock);
}

// Replace signingConfig under release
gradle = gradle.replace(
  /release \{\s*\/\/[^\n]*\s*\/\/[^\n]*\s*signingConfig signingConfigs\.debug/m,
  `release {
            // Configured production release signing
            signingConfig (file('release.jks').exists() ? signingConfigs.release : signingConfigs.debug)`
);

fs.writeFileSync(gradlePath, gradle, 'utf8');
console.log('Successfully configured release signing in android/app/build.gradle');
