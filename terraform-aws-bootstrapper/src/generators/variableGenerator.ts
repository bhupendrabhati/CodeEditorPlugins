import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates the Terraform variables file (variables.tf).
 */
export class VariableGenerator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'variables.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'variables.tf',
                content,
            },
        ];
    }
}
