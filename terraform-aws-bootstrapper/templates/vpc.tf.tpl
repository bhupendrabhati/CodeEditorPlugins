# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "{{VPC_CIDR}}"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "{{PROJECT_NAME}}-vpc"
    Environment = "dev"
    Project     = "{{PROJECT_NAME}}"
  }
}

# Public Subnet
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "{{PUBLIC_SUBNET_CIDR}}"
  map_public_ip_on_launch = true
  availability_zone       = data.aws_availability_zones.available.names[0]

  tags = {
    Name        = "{{PROJECT_NAME}}-public-subnet"
    Environment = "dev"
    Project     = "{{PROJECT_NAME}}"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "{{PROJECT_NAME}}-igw"
    Environment = "dev"
    Project     = "{{PROJECT_NAME}}"
  }
}

# Route Table
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "{{PROJECT_NAME}}-public-rt"
    Environment = "dev"
    Project     = "{{PROJECT_NAME}}"
  }
}

# Route Table Association
resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}
