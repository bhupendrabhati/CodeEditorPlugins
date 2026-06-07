import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates the Terraform S3 backend configuration file (backend.tf).
 */
export class BackendGenerator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'backend.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'backend.tf',
                content,
            },
        ];
    }
}
