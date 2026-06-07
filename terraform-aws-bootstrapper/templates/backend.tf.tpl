terraform {
  backend "s3" {
    bucket         = "{{STATE_BUCKET}}"
    key            = "{{PROJECT_NAME}}/terraform.tfstate"
    region         = "{{AWS_REGION}}"
    dynamodb_table = "{{LOCK_TABLE}}"
    encrypt        = true
  }
}
