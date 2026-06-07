import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, Generator, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates the AWS provider configuration file (provider.tf).
 */
export class ProviderGenerator implements Generator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'provider.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'provider.tf',
                content,
            },
        ];
    }
}
