variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "{{AWS_REGION}}"
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "{{VPC_CIDR}}"
}

variable "public_subnet_cidr" {
  description = "Public subnet CIDR block"
  type        = string
  default     = "{{PUBLIC_SUBNET_CIDR}}"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "{{INSTANCE_TYPE}}"
}

variable "instance_name" {
  description = "EC2 instance name"
  type        = string
  default     = "{{INSTANCE_NAME}}"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "{{PROJECT_NAME}}"
}
