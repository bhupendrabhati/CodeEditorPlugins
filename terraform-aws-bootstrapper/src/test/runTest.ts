import * as path from 'path';
import { runTests } from '@vscode/test-electron';

/**
 * Runs the VS Code extension integration tests using @vscode/test-electron.
 * This script:
 * 1. Downloads VS Code (if not already cached)
 * 2. Launches it with the extension installed
 * 3. Runs the test suite defined in extension.test.ts
 */
async function main(): Promise<void> {
    try {
        // The extension development path (project root with package.json)
        const extensionDevelopmentPath = path.resolve(__dirname, '..', '..', '..');

        // The path to the compiled test files
        const extensionTestsPath = path.resolve(__dirname, 'extension.test');

        console.log(`Running tests from: ${extensionTestsPath}`);
        console.log(`Extension development path: ${extensionDevelopmentPath}`);

        // Download VS Code, unzip it and run the integration test
        await runTests({
            extensionDevelopmentPath,
            extensionTestsPath,
            launchArgs: [
                '--disable-extensions',
                '--skip-welcome',
                '--skip-release-notes',
            ],
        });
    } catch (err) {
        console.error('Failed to run tests:', err);
        process.exit(1);
    }
}

main();
