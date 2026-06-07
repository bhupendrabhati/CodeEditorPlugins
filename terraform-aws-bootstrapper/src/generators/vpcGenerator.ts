import { TemplateEngine } from '../utils/templateEngine';
import { FileOutput, TemplateVariables } from '../types';
import * as path from 'path';

/**
 * Generates the VPC infrastructure file (main.tf) containing VPC,
 * public subnet, internet gateway, route table, and availability zone data.
 */
export class VpcGenerator {
    async generate(templateVars: TemplateVariables, templateDir: string): Promise<FileOutput[]> {
        const templatePath = path.join(templateDir, 'vpc.tf.tpl');
        const content = await TemplateEngine.loadAndRender(templatePath, templateVars);

        return [
            {
                filename: 'main.tf',
                content,
            },
        ];
    }
}
