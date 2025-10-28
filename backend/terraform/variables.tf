variable "aws_region" {
  type        = string
  description = "AWS region"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  description = "Environment (staging, production)"
  default     = "staging"
}

variable "project_name" {
  type        = string
  description = "Project name for resource naming"
  default     = "hybrid-ci-cd"
}

variable "app_name" {
  type        = string
  description = "Application name"
  default     = "hybrid-ci-cd-backend"
}

variable "app_version" {
  type        = string
  description = "Application version"
  default     = "0.1.0"
}

variable "lambda_memory_mb" {
  type        = number
  description = "Lambda function memory in MB"
  default     = 1024
}

variable "lambda_timeout_seconds" {
  type        = number
  description = "Lambda function timeout in seconds"
  default     = 30
}

variable "lambda_reserved_concurrency" {
  type        = number
  description = "Reserved concurrent executions (null = unlimited)"
  default     = null
}

variable "dynamodb_billing_mode" {
  type        = string
  description = "DynamoDB billing mode (PROVISIONED or PAY_PER_REQUEST)"
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_read_capacity" {
  type        = number
  description = "DynamoDB provisioned read capacity units (only if PROVISIONED)"
  default     = 5
}

variable "dynamodb_write_capacity" {
  type        = number
  description = "DynamoDB provisioned write capacity units (only if PROVISIONED)"
  default     = 5
}

variable "session_ttl_hours" {
  type        = number
  description = "Session TTL in hours"
  default     = 24
}

variable "cors_origins" {
  type        = list(string)
  description = "CORS allowed origins"
  default     = ["http://localhost:3000"]
}

variable "log_retention_days" {
  type        = number
  description = "CloudWatch log retention in days"
  default     = 7
}
