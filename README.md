# Terraform AWS Bootstrapper

Generate complete AWS Terraform projects directly from Visual Studio Code.

## Features

* Generate Terraform project structure
* AWS Provider configuration
* S3 Backend configuration
* State locking configuration
* VPC and Public Subnet
* Security Group
* EC2 Instance
* Variables and Outputs
* README and tfvars example generation

## Usage

1. Open VS Code
2. Press `Ctrl+Shift+P` / `Cmd+Shift+P`
3. Run:

```text
Terraform AWS Bootstrapper: Generate Project
```

4. Enter the required AWS and Terraform details
5. The extension generates a ready-to-use Terraform project

## Generated Files

```text
project-name/
├── provider.tf
├── backend.tf
├── versions.tf
├── main.tf
├── variables.tf
├── outputs.tf
├── terraform.tfvars.example
└── README.md
```

## Author

**Bhupendra Bhati**

LinkedIn: https://www.linkedin.com/in/bhupendrabhati

GitHub: https://github.com/bhupendrabhati/CodeEditorPlugins

## License

MIT License
