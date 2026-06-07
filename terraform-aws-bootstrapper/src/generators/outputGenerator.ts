import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates the Terraform outputs file (outputs.tf).
 */
export class OutputGenerator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'outputs.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'outputs.tf',
                content,
            },
        ];
    }
}
