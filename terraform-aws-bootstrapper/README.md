# Terraform AWS Bootstrapper

A VS Code extension that automatically generates a complete Terraform project for AWS infrastructure. Perfect for beginners who want to quickly bootstrap a working Terraform project.

## Features

- **One-command generation** — Open the Command Palette and run `Terraform AWS Bootstrapper: Generate Project`
- **Interactive inputs** — Enter project name, AWS region, CIDR blocks, instance type, and more
- **Complete Terraform project** — Generates all required files with proper configuration
- **S3 backend** — Remote state storage with DynamoDB state locking
- **Production-ready** — Follows Terraform best practices and conventions

## What It Generates

- `provider.tf` — AWS provider configuration
- `backend.tf` — S3 backend for remote state
- `versions.tf` — Terraform and provider version constraints
- `main.tf` — Core infrastructure (VPC, subnet, EC2, security group)
- `variables.tf` — Input variables with sensible defaults
- `outputs.tf` — Output values for key resources
- `terraform.tfvars.example` — Example variable values file
- `README.md` — Comprehensive documentation for the generated project

### Infrastructure Provisioned

| Resource | Description |
|----------|-------------|
| VPC | Configurable CIDR block with DNS support |
| Public Subnet | Auto-assigns public IPs |
| Internet Gateway | Enables internet access |
| Route Table | Default route to IGW |
| Security Group | HTTP (80), HTTPS (443), SSH (22) ingress |
| EC2 Instance | Amazon Linux 2 with Apache HTTPD |

## Usage

1. Install the extension
2. Open the Command Palette (`Cmd+Shift+P` or `Ctrl+Shift+P`)
3. Run **Terraform AWS Bootstrapper: Generate Project**
4. Fill in the required fields:
   - Project Name
   - AWS Region
   - VPC CIDR
   - Public Subnet CIDR
   - EC2 Instance Type
   - EC2 Name Tag
   - S3 Backend Bucket Name
   - DynamoDB Lock Table Name
   - AWS Profile Name
5. The extension creates the project folder and opens it in VS Code

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An existing S3 bucket for state storage
- An existing DynamoDB table for state locking

## Commands

| Command | Description |
|---------|-------------|
| `Terraform AWS Bootstrapper: Generate Project` | Generate a new Terraform project |

## Development

```bash
# Clone the repository
git clone <repo-url>

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Package the extension
npm run package
```

## Extension Structure

```
terraform-aws-bootstrapper/
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript configuration
├── templates/             # Terraform template files
│   ├── provider.tf.tpl
│   ├── backend.tf.tpl
│   ├── versions.tf.tpl
│   ├── vpc.tf.tpl
│   ├── ec2.tf.tpl
│   ├── variables.tf.tpl
│   └── outputs.tf.tpl
├── src/
│   ├── extension.ts       # Extension entry point
│   ├── types.ts           # Shared TypeScript interfaces
│   ├── commands/
│   │   └── generateProject.ts  # Main command handler
│   ├── generators/        # Terraform file generators
│   │   ├── providerGenerator.ts
│   │   ├── backendGenerator.ts
│   │   ├── vpcGenerator.ts
│   │   ├── ec2Generator.ts
│   │   ├── variableGenerator.ts
│   │   └── outputGenerator.ts
│   ├── utils/
│   │   ├── templateEngine.ts
│   │   └── fileWriter.ts
│   └── test/
│       ├── extension.test.ts
│       └── runTest.ts
└── .vscodeignore
```

## License

MIT

## Author

Bhupendra Bhati

- LinkedIn: https://www.linkedin.com/in/your-linkedin-profile/
- GitHub: https://github.com/your-github
