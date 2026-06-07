/**
 * Template variables key-value map.
 * Keys should match the placeholder names (e.g., "AWS_REGION" for {{AWS_REGION}}).
 */
export interface TemplateVariables {
    [key: string]: string;
}

/**
 * Describes a file to be generated.
 */
export interface FileOutput {
    filename: string;
    content: string;
}

/**
 * Interface for all Terraform file generators.
 */
export interface Generator {
    generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]>;
}
