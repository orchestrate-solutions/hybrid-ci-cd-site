# Lambda function and related resources

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-lambda-logs"
  }
}

# Lambda function
resource "aws_lambda_function" "backend" {
  filename      = "lambda_function.zip"
  function_name = "${var.project_name}-${var.environment}"
  role          = aws_iam_role.lambda_role.arn
  handler       = "src.handlers.lambda_handler.lambda_handler"
  runtime       = "python3.11"
  
  timeout       = var.lambda_timeout_seconds
  memory_size   = var.lambda_memory_mb
  
  reserved_concurrent_executions = var.lambda_reserved_concurrency

  environment {
    variables = {
      ENVIRONMENT                  = var.environment
      AWS_REGION                   = var.aws_region
      DYNAMODB_TABLE_SESSIONS      = aws_dynamodb_table.sessions.name
      DYNAMODB_TABLE_JOBS          = aws_dynamodb_table.jobs.name
      DYNAMODB_TABLE_AGENTS        = aws_dynamodb_table.agents.name
      SESSION_TTL_SECONDS          = var.session_ttl_hours * 3600
      CORS_ORIGINS                 = jsonencode(var.cors_origins)
    }
  }

  layers = [
    # Future: Lambda layer for dependencies
    # aws_lambda_layer_version.dependencies.arn
  ]

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    aws_iam_role_policy_attachment.lambda_logs,
    aws_iam_role_policy.lambda_dynamodb,
  ]

  tags = {
    Name = "${var.project_name}-lambda"
  }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "http_api" {
  name          = "${var.project_name}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = var.cors_origins
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["*"]
    expose_headers = ["*"]
    max_age      = 300
  }

  tags = {
    Name = "${var.project_name}-api"
  }
}

# Integration with Lambda
resource "aws_apigatewayv2_integration" "lambda" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "AWS_PROXY"
  integration_method = "POST"
  payload_format_version = "2.0"
  target = aws_lambda_function.backend.arn
}

# Lambda permissions
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

# Route all requests to Lambda
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# Stage
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      ip              = "$context.identity.sourceIp"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      resourcePath    = "$context.resourcePath"
      status          = "$context.status"
      protocol        = "$context.protocol"
      responseLength  = "$context.responseLength"
      integrationLatency = "$context.integration.latency"
    })
  }

  tags = {
    Name = "${var.project_name}-stage"
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-${var.environment}"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "${var.project_name}-api-logs"
  }
}
