import * as vscode from 'vscode';
import { generateProjectCommand } from './commands/generateProject';

/**
 * Activates the Terraform AWS Bootstrapper extension.
 * Registers the "Terraform AWS Bootstrapper: Generate Project" command.
 *
 * @param context - The VS Code extension context provided at activation.
 */
export function activate(context: vscode.ExtensionContext): void {
    console.log('[Terraform AWS Bootstrapper] Extension is now active!');

    const disposable = vscode.commands.registerCommand(
        'terraform-aws-bootstrapper.generateProject',
        async () => {
            await generateProjectCommand(context);
        }
    );

    context.subscriptions.push(disposable);
}

/**
 * Deactivates the extension.
 * Cleanup logic can be placed here if needed.
 */
export function deactivate(): void {
    console.log('[Terraform AWS Bootstrapper] Extension deactivated.');
}
