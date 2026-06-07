import * as fs from 'fs';

/**
 * Template variables key-value map.
 * Keys should match the placeholder names (e.g., "AWS_REGION" for {{AWS_REGION}}).
 */
export interface TemplateVariables {
    [key: string]: string;
}

/**
 * Reusable template engine that loads template files from disk
 * and replaces {{PLACEHOLDER}} tokens with provided values.
 */
export class TemplateEngine {
    /**
     * Loads a template file from disk and returns its raw content.
     * @param templatePath - Absolute path to the template file.
     * @returns The raw template string.
     */
    static async load(templatePath: string): Promise<string> {
        try {
            const content = await fs.promises.readFile(templatePath, 'utf8');
            return content;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to load template at "${templatePath}": ${message}`);
        }
    }

    /**
     * Synchronously loads a template file from disk.
     * @param templatePath - Absolute path to the template file.
     * @returns The raw template string.
     */
    static loadSync(templatePath: string): string {
        try {
            const content = fs.readFileSync(templatePath, 'utf8');
            return content;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to load template at "${templatePath}": ${message}`);
        }
    }

    /**
     * Renders a template string by replacing all {{PLACEHOLDER}} tokens
     * with the corresponding values from the variables map.
     *
     * @param template - The raw template string containing {{PLACEHOLDER}} tokens.
     * @param variables - Key-value map of placeholder replacements.
     * @returns The rendered string with all placeholders replaced.
     */
    static render(template: string, variables: TemplateVariables): string {
        let result = template;
        for (const [key, value] of Object.entries(variables)) {
            // Escape special regex characters in the key
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const placeholderRegex = new RegExp(`\\{\\{${escapedKey}\\}\\}`, 'g');
            result = result.replace(placeholderRegex, value);
        }
        return result;
    }

    /**
     * Loads a template from disk, renders it with the provided variables, and returns the result.
     *
     * @param templatePath - Absolute path to the template file.
     * @param variables - Key-value map of placeholder replacements.
     * @returns The fully rendered template string.
     */
    static async loadAndRender(templatePath: string, variables: TemplateVariables): Promise<string> {
        const template = await TemplateEngine.load(templatePath);
        return TemplateEngine.render(template, variables);
    }
}
