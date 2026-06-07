import * as vscode from 'vscode';
import * as path from 'path';
import { ProviderGenerator } from '../generators/providerGenerator';
import { BackendGenerator } from '../generators/backendGenerator';
import { VpcGenerator } from '../generators/vpcGenerator';
import { Ec2Generator } from '../generators/ec2Generator';
import { FileWriter } from '../utils/fileWriter';
import { TemplateEngine } from '../utils/templateEngine';

/**
 * User-provided inputs for the Terraform project generation.
 * Optional sections use boolean flags; their values are only populated
 * when the user opts to configure them.
 */
interface UserInputs {
    projectName: string;
    awsRegion: string;
    awsProfile: string;
    outputDir: string;

    // VPC & Networking
    includeVpc: boolean;
    vpcCidr: string;
    subnetCidr: string;

    // EC2 Instance
    includeEc2: boolean;
    instanceType: string;
    instanceName: string;

    // S3 Backend
    includeBackend: boolean;
    stateBucket: string;
    lockTable: string;
}

/**
 * Shows an input box dialog and returns the user's input.
 */
async function showInputBox(
    prompt: string,
    placeHolder: string,
    validateInput?: (value: string) => string | undefined | null
): Promise<string | undefined> {
    return vscode.window.showInputBox({
        prompt,
        placeHolder,
        validateInput,
        ignoreFocusOut: true,
    });
}

/**
 * Default validation: ensures the input is not empty.
 */
function requiredInput(value: string): string | undefined {
    return value.trim().length === 0 ? 'This field is required' : undefined;
}

/**
 * Shows a QuickPick dialog with two choices: configure or skip.
 *
 * @returns true if user chose to configure, false if skip, undefined if cancelled.
 */
async function showConfigureOrSkip(
    prompt: string,
    configureLabel: string,
    skipLabel: string
): Promise<boolean | undefined> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: `\u2705 ${configureLabel}` },
            { label: `\u23ED\uFE0F  ${skipLabel}` },
        ],
        { placeHolder: prompt, ignoreFocusOut: true }
    );
    if (!choice) return undefined;
    return choice.label.startsWith('\u2705');
}

/**
 * Collects all required user inputs through VS Code dialogs.
 * Each optional section (VPC, EC2, Backend) can be configured or skipped.
 */
async function collectInputs(): Promise<UserInputs | undefined> {
    // --- Required inputs (always asked) ---

    const projectName = await showInputBox(
        'Enter the Terraform project name',
        'my-terraform-project',
        requiredInput
    );
    if (!projectName) return undefined;

    const awsRegion = await showInputBox(
        'Enter the AWS region',
        'us-east-1',
        requiredInput
    );
    if (!awsRegion) return undefined;

    const awsProfile = await showInputBox(
        'Enter the AWS CLI profile name',
        'default',
        requiredInput
    );
    if (!awsProfile) return undefined;

    // --- VPC & Networking (optional) ---

    let includeVpc = false;
    let vpcCidr = '';
    let subnetCidr = '';

    const wantVpc = await showConfigureOrSkip(
        'Do you want to set up VPC & Networking?',
        'Configure VPC & Networking',
        'Skip VPC & Networking'
    );
    if (wantVpc === undefined) return undefined;

    if (wantVpc) {
        includeVpc = true;

        const vpcCidrInput = await showInputBox(
            'Enter the VPC CIDR block',
            '10.0.0.0/16',
            requiredInput
        );
        if (!vpcCidrInput) return undefined;
        vpcCidr = vpcCidrInput;

        const subnetCidrInput = await showInputBox(
            'Enter the public subnet CIDR block',
            '10.0.1.0/24',
            requiredInput
        );
        if (!subnetCidrInput) return undefined;
        subnetCidr = subnetCidrInput;
    }

    // --- EC2 Instance (optional, only offered if VPC is configured) ---

    let includeEc2 = false;
    let instanceType = '';
    let instanceName = '';

    if (includeVpc) {
        const wantEc2 = await showConfigureOrSkip(
            'Do you want to set up an EC2 Instance?',
            'Configure EC2 Instance',
            'Skip EC2 Instance'
        );
        if (wantEc2 === undefined) return undefined;

        if (wantEc2) {
            includeEc2 = true;

            const instanceTypeInput = await showInputBox(
                'Enter the EC2 instance type',
                't2.micro',
                requiredInput
            );
            if (!instanceTypeInput) return undefined;
            instanceType = instanceTypeInput;

            const instanceNameInput = await showInputBox(
                'Enter the EC2 instance name tag',
                'web-server',
                requiredInput
            );
            if (!instanceNameInput) return undefined;
            instanceName = instanceNameInput;
        }
    }

    // --- S3 Backend (optional) ---

    let includeBackend = false;
    let stateBucket = '';
    let lockTable = '';

    const wantBackend = await showConfigureOrSkip(
        'Do you want to set up an S3 Backend?',
        'Configure S3 Backend',
        'Skip S3 Backend'
    );
    if (wantBackend === undefined) return undefined;

    if (wantBackend) {
        includeBackend = true;

        const stateBucketInput = await showInputBox(
            'Enter the S3 backend bucket name (must be globally unique)',
            'my-terraform-state-bucket',
            requiredInput
        );
        if (!stateBucketInput) return undefined;
        stateBucket = stateBucketInput;

        const lockTableInput = await showInputBox(
            'Enter the DynamoDB state lock table name',
            'terraform-state-lock',
            requiredInput
        );
        if (!lockTableInput) return undefined;
        lockTable = lockTableInput;
    }

    // --- Select output folder ---

    const selectedFolder = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Select Output Folder'
    });

    if (!selectedFolder || selectedFolder.length === 0) {
        return undefined;
    }

    const outputDir = path.join(
        selectedFolder[0].fsPath,
        projectName
    );

    console.log('projectName =', projectName);
    console.log('includeVpc =', includeVpc);
    console.log('includeEc2 =', includeEc2);
    console.log('includeBackend =', includeBackend);
    console.log('outputDir =', outputDir);

    return {
        projectName,
        awsRegion,
        awsProfile,
        outputDir,

        includeVpc,
        vpcCidr,
        subnetCidr,

        includeEc2,
        instanceType,
        instanceName,

        includeBackend,
        stateBucket,
        lockTable,
    };
}

/**
 * Generates a terraform.tfvars.example file with default variable values.
 * Only includes variables for resources the user chose to configure.
 */
function generateTfvarsExample(inputs: UserInputs): string {
    let content = `# Terraform AWS Bootstrapper - Example Variable Values
# Copy this file to terraform.tfvars and fill in your values.

aws_region         = "${inputs.awsRegion}"
environment        = "dev"
project_name       = "${inputs.projectName}"
`;

    if (inputs.includeVpc) {
        content += `vpc_cidr           = "${inputs.vpcCidr}"
public_subnet_cidr = "${inputs.subnetCidr}"
`;
    }

    if (inputs.includeEc2) {
        content += `instance_type      = "${inputs.instanceType}"
instance_name      = "${inputs.instanceName}"
`;
    }

    return content;
}

/**
 * Generates a variables.tf content based on which resources are included.
 */
function generateVariablesContent(inputs: UserInputs): string {
    let content = `variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "${inputs.awsRegion}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "${inputs.projectName}"
}
`;

    if (inputs.includeVpc) {
        content += `
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "${inputs.vpcCidr}"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR block"
  type        = string
  default     = "${inputs.subnetCidr}"
}
`;
    }

    if (inputs.includeEc2) {
        content += `
variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "${inputs.instanceType}"
}

variable "instance_name" {
  description = "EC2 instance name"
  type        = string
  default     = "${inputs.instanceName}"
}
`;
    }

    return content.trim();
}

/**
 * Generates an outputs.tf content based on which resources are included.
 */
function generateOutputsContent(inputs: UserInputs): string {
    let content = '';

    if (inputs.includeVpc) {
        content += `output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr" {
  description = "The CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_id" {
  description = "The ID of the public subnet"
  value       = aws_subnet.public.id
}

output "public_subnet_cidr" {
  description = "The CIDR block of the public subnet"
  value       = aws_subnet.public.cidr_block
}

output "internet_gateway_id" {
  description = "The ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

`;
    }

    if (inputs.includeEc2) {
        content += `output "security_group_id" {
  description = "The ID of the web security group"
  value       = aws_security_group.web.id
}

output "ec2_instance_id" {
  description = "The ID of the EC2 instance"
  value       = aws_instance.web.id
}

output "ec2_instance_public_ip" {
  description = "The public IP of the EC2 instance"
  value       = aws_instance.web.public_ip
}

output "ec2_instance_public_dns" {
  description = "The public DNS of the EC2 instance"
  value       = aws_instance.web.public_dns
}

`;
    }

    content += `output "aws_region" {
  description = "The AWS region"
  value       = var.aws_region
}
`;

    return content.trim();
}

/**
 * Generates a README.md documentation file for the generated Terraform project.
 * Only includes sections for resources the user chose to configure.
 */
function generateReadme(inputs: UserInputs): string {
    let overviewItems = '';
    if (inputs.includeVpc) {
        overviewItems += `- **VPC** with CIDR block \`${inputs.vpcCidr}\`
- **Public Subnet** with CIDR block \`${inputs.subnetCidr}\`
- **Internet Gateway** for public internet access
- **Route Table** with default route to the Internet Gateway
`;
    }
    if (inputs.includeEc2) {
        overviewItems += `- **Security Group** allowing HTTP (80), HTTPS (443), and SSH (22) traffic
- **EC2 Instance** of type \`${inputs.instanceType}\` running Amazon Linux 2
`;
    }
    if (inputs.includeBackend) {
        overviewItems += `- **S3 Backend** for remote state storage
- **DynamoDB Table** for state locking
`;
    }

    let prerequisites = `- [Terraform](https://www.terraform.io/downloads.html) >= 1.0.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with profile: \`${inputs.awsProfile}\`
`;
    if (inputs.includeBackend) {
        prerequisites += `- An existing S3 bucket named \`${inputs.stateBucket}\`
- An existing DynamoDB table named \`${inputs.lockTable}\`
`;
    }

    let projectStructure = `\`\`\`
${inputs.projectName}/
\u251C\u2500\u2500 provider.tf          # AWS provider configuration
`;
    if (inputs.includeBackend) {
        projectStructure += `\u251C\u2500\u2500 backend.tf           # S3 backend configuration
`;
    }
    projectStructure += `\u251C\u2500\u2500 versions.tf          # Terraform and provider version constraints
`;
    if (inputs.includeVpc || inputs.includeEc2) {
        projectStructure += `\u251C\u2500\u2500 main.tf              # Core infrastructure (VPC, subnet, EC2, etc.)
`;
    }
    projectStructure += `\u251C\u2500\u2500 variables.tf         # Input variables
\u251C\u2500\u2500 outputs.tf           # Output values
\u251C\u2500\u2500 terraform.tfvars.example  # Example variable values
\u2514\u2500\u2500 README.md            # This file
\`\`\`
`;

    let securityGroupTable = '';
    if (inputs.includeEc2) {
        securityGroupTable = `
## Security Group Rules

| Direction | Protocol | Port(s) | Source     | Purpose      |
|-----------|----------|---------|------------|--------------|
| Ingress   | TCP      | 80      | 0.0.0.0/0 | HTTP traffic |
| Ingress   | TCP      | 443     | 0.0.0.0/0 | HTTPS traffic|
| Ingress   | TCP      | 22      | 0.0.0.0/0 | SSH access   |
| Egress    | All      | All     | 0.0.0.0/0 | Outbound     |
`;
    }

    let outputs = '';
    if (inputs.includeVpc || inputs.includeEc2) {
        outputs = `
## Outputs

After applying, Terraform will output:
`;
        if (inputs.includeVpc) {
            outputs += `
- \`vpc_id\` - The ID of the created VPC
- \`vpc_cidr\` - The CIDR block of the VPC
- \`public_subnet_id\` - The ID of the public subnet
`;
        }
        if (inputs.includeEc2) {
            outputs += `
- \`ec2_instance_id\` - The ID of the EC2 instance
- \`ec2_instance_public_ip\` - The public IP address of the EC2 instance
- \`ec2_instance_public_dns\` - The public DNS name of the EC2 instance
`;
        }
    }

    return `# ${inputs.projectName}

## Overview

This Terraform project was automatically generated by **Terraform AWS Bootstrapper**.
It provisions the following AWS infrastructure:

${overviewItems}
## Prerequisites

${prerequisites}
## Quick Start

### 1. Initialize Terraform

\`\`\`bash
terraform init
\`\`\`

### 2. Review the execution plan

\`\`\`bash
terraform plan
\`\`\`

### 3. Apply the configuration

\`\`\`bash
terraform apply
\`\`\`

### 4. Destroy resources (when no longer needed)

\`\`\`bash
terraform destroy
\`\`\`

## Project Structure

${projectStructure}${securityGroupTable}${outputs}
## Customization

Edit \`variables.tf\` or create a \`terraform.tfvars\` file to override default values.

\`\`\`hcl
# terraform.tfvars
instance_type = "t3.small"
environment   = "production"
\`\`\`

## Cleanup

To avoid incurring charges, destroy all resources when they are no longer needed:

\`\`\`bash
terraform destroy
\`\`\`

## License

This project was generated by Terraform AWS Bootstrapper.
`;
}

/**
 * Main command handler.
 * Collects user inputs, generates all Terraform files, and opens the project.
 */
export async function generateProjectCommand(context: vscode.ExtensionContext): Promise<void> {
    try {
        const inputs = await collectInputs();
        if (!inputs) {
            return;
        }

        await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Generating Terraform AWS project...',
                cancellable: false,
            },
            async (progress) => {
                progress.report({ message: 'Creating project directory...' });

                // Build template variables map (all values included; unused ones are ignored)
                const templateVars: Record<string, string> = {
                    PROJECT_NAME: inputs.projectName,
                    AWS_REGION: inputs.awsRegion,
                    VPC_CIDR: inputs.vpcCidr,
                    PUBLIC_SUBNET_CIDR: inputs.subnetCidr,
                    INSTANCE_TYPE: inputs.instanceType,
                    INSTANCE_NAME: inputs.instanceName,
                    STATE_BUCKET: inputs.stateBucket,
                    LOCK_TABLE: inputs.lockTable,
                    AWS_PROFILE: inputs.awsProfile,
                };

                // Templates are in a "templates" directory at the extension root
                const templateDir = path.join(context.extensionPath, 'templates');

                progress.report({ message: 'Rendering Terraform templates...' });

                // Conditionally build generators based on what the user chose to include
                const allFileOutputs: { filename: string; content: string }[] = [];

                // Provider is always generated
                const providerGen = new ProviderGenerator();
                allFileOutputs.push(...await providerGen.generate(templateVars, templateDir));

                // Backend (optional)
                if (inputs.includeBackend) {
                    const backendGen = new BackendGenerator();
                    allFileOutputs.push(...await backendGen.generate(templateVars, templateDir));
                }

                // VPC & Networking (optional)
                if (inputs.includeVpc) {
                    const vpcGen = new VpcGenerator();
                    allFileOutputs.push(...await vpcGen.generate(templateVars, templateDir));
                }

                // EC2 Instance (optional, depends on VPC)
                if (inputs.includeEc2) {
                    const ec2Gen = new Ec2Generator();
                    allFileOutputs.push(...await ec2Gen.generate(templateVars, templateDir));
                }

                // Generate versions.tf using the template engine
                const versionsTemplatePath = path.join(templateDir, 'versions.tf.tpl');
                const versionsContent = await TemplateEngine.loadAndRender(
                    versionsTemplatePath,
                    templateVars
                );
                allFileOutputs.push({ filename: 'versions.tf', content: versionsContent });

                // Generate variables.tf dynamically based on included resources
                allFileOutputs.push({
                    filename: 'variables.tf',
                    content: generateVariablesContent(inputs),
                });

                // Generate outputs.tf dynamically based on included resources
                allFileOutputs.push({
                    filename: 'outputs.tf',
                    content: generateOutputsContent(inputs),
                });

                // Merge files that target the same filename (e.g., VPC + EC2 both write to main.tf)
                const mergedFiles = new Map<string, string>();
                for (const file of allFileOutputs) {
                    const existing = mergedFiles.get(file.filename);
                    if (existing) {
                        mergedFiles.set(file.filename, existing + '\n\n' + file.content);
                    } else {
                        mergedFiles.set(file.filename, file.content);
                    }
                }

                progress.report({ message: 'Writing files to disk...' });

                // Write all Terraform files
                for (const [filename, content] of mergedFiles) {
                    const filePath = path.join(inputs.outputDir, filename);
                    console.log('Writing file:', filePath);
                    await FileWriter.writeFile(filePath, content);
                }

                // Generate terraform.tfvars.example
                const tfvarsContent = generateTfvarsExample(inputs);
                await FileWriter.writeFile(
                    path.join(inputs.outputDir, 'terraform.tfvars.example'),
                    tfvarsContent
                );

                // Generate README.md
                const readmeContent = generateReadme(inputs);
                await FileWriter.writeFile(
                    path.join(inputs.outputDir, 'README.md'),
                    readmeContent
                );

                progress.report({ message: 'Opening generated project...' });

                // Open the generated folder in VS Code
                const uri = vscode.Uri.file(inputs.outputDir);
                await vscode.commands.executeCommand('vscode.openFolder', uri, {
                    forceNewWindow: false,
                });

                // Show success notification
                vscode.window.showInformationMessage(
                    `Terraform project "${inputs.projectName}" generated successfully at ${inputs.outputDir}!`
                );
            }
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        vscode.window.showErrorMessage(`Failed to generate Terraform project: ${message}`);
        console.error('[Terraform AWS Bootstrapper] Error:', error);
    }
}
