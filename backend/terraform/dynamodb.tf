# DynamoDB Tables

# Sessions table - stores user sessions with TTL-based auto-deletion
resource "aws_dynamodb_table" "sessions" {
  name           = "${var.project_name}-sessions-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "session_id"
  
  read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  
  attribute {
    name = "session_id"
    type = "S"
  }
  
  attribute {
    name = "user_id"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "N"
  }
  
  # Global Secondary Index for querying by user_id
  global_secondary_index {
    name            = "user_id-created_at-index"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
    
    read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }
  
  # TTL configuration - auto-delete expired sessions
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-sessions"
  }
}

# Jobs table - tracks CI/CD job execution
resource "aws_dynamodb_table" "jobs" {
  name           = "${var.project_name}-jobs-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "job_id"
  
  read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  
  attribute {
    name = "job_id"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "N"
  }
  
  # GSI for querying recent jobs
  global_secondary_index {
    name            = "created_at-index"
    hash_key        = "created_at"
    projection_type = "ALL"
    
    read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-jobs"
  }
}

# Deployments table - tracks deployment history across environments
resource "aws_dynamodb_table" "deployments" {
  name           = "${var.project_name}-deployments-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "deployment_id"
  
  read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  
  attribute {
    name = "deployment_id"
    type = "S"
  }
  
  attribute {
    name = "service_name"
    type = "S"
  }
  
  attribute {
    name = "created_at"
    type = "S"  # ISO format timestamp for sorting
  }
  
  # GSI for querying deployments by service (service history)
  global_secondary_index {
    name            = "service_name-created_at-index"
    hash_key        = "service_name"
    range_key       = "created_at"
    projection_type = "ALL"
    
    read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }
  
  # TTL configuration - auto-delete old deployment records (6 months)
  ttl {
    attribute_name = "ttl_expiration"
    enabled        = true
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-deployments"
  }
}

# Agents table - tracks execution agents
resource "aws_dynamodb_table" "agents" {
  name           = "${var.project_name}-agents-${var.environment}"
  billing_mode   = var.dynamodb_billing_mode
  hash_key       = "agent_id"
  
  read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
  write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  
  attribute {
    name = "agent_id"
    type = "S"
  }
  
  attribute {
    name = "region"
    type = "S"
  }
  
  # GSI for querying agents by region
  global_secondary_index {
    name            = "region-index"
    hash_key        = "region"
    projection_type = "ALL"
    
    read_capacity_units  = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_read_capacity : null
    write_capacity_units = var.dynamodb_billing_mode == "PROVISIONED" ? var.dynamodb_write_capacity : null
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = {
    Name = "${var.project_name}-agents"
  }
}
