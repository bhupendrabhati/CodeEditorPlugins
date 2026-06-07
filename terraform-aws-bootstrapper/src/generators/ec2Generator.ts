import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates EC2 instance and security group configuration.
 * The output is appended to main.tf (same file as VPC resources).
 */
export class Ec2Generator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'ec2.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'main.tf',
                content,
            },
        ];
    }
}
