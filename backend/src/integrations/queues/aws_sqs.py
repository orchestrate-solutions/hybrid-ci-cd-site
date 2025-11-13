"""
AWS SQS Queue Client - Implementation for user-owned SQS queues.

Implements QueueClientInterface for AWS SQS with:
- IAM role-based authentication (user grants read/write access)
- Long-polling for efficient message retrieval
- Message deletion after processing
- Queue attribute monitoring

SECURITY: Provider only reads/writes to user's queue with user-granted IAM permissions.
No secrets required from user - authentication via IAM cross-account role assumption.
"""

import json
import boto3
from typing import List, Dict, Any, Optional
from botocore.exceptions import ClientError, BotoCoreError

from backend.src.integrations.queues.base import QueueClientInterface


class AWSSQSClient(QueueClientInterface):
    """
    AWS SQS queue client for user-owned queues.
    
    Config format:
        {
            'provider': 'aws_sqs',
            'endpoint': 'https://sqs.us-east-1.amazonaws.com/123456789012/queue-name',
            'region': 'us-east-1',
            'auth': {
                'method': 'iam_role',
                'role_arn': 'arn:aws:iam::USER_ACCOUNT:role/OrchestratePollRole'
            }
        }
    
    IAM Role Policy (user creates in their account):
        {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"AWS": "arn:aws:iam::PROVIDER_ACCOUNT:root"},
                "Action": [
                    "sqs:ReceiveMessage",
                    "sqs:SendMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                ],
                "Resource": "arn:aws:sqs:REGION:USER_ACCOUNT:queue-name"
            }]
        }
    """
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize AWS SQS client.
        
        Args:
            config: Queue configuration dict
        
        Raises:
            ValueError: If config invalid
        """
        self.config = config
        self.queue_url = config.get('endpoint')
        self.region = config.get('region', 'us-east-1')
        
        if not self.queue_url:
            raise ValueError("Queue endpoint (URL) required for AWS SQS")
        
        # Initialize boto3 client
        auth = config.get('auth', {})
        auth_method = auth.get('method', 'iam_role')
        
        if auth_method == 'iam_role':
            role_arn = auth.get('role_arn')
            if not role_arn:
                raise ValueError("role_arn required for IAM role authentication")
            
            # Assume cross-account role granted by user
            sts = boto3.client('sts', region_name=self.region)
            assumed_role = sts.assume_role(
                RoleArn=role_arn,
                RoleSessionName='OrchestratePollSession'
            )
            
            credentials = assumed_role['Credentials']
            self.sqs = boto3.client(
                'sqs',
                region_name=self.region,
                aws_access_key_id=credentials['AccessKeyId'],
                aws_secret_access_key=credentials['SecretAccessKey'],
                aws_session_token=credentials['SessionToken']
            )
        else:
            # Default credentials (for development/testing)
            self.sqs = boto3.client('sqs', region_name=self.region)
    
    async def poll_messages(self, max_messages: int = 10, wait_seconds: int = 20) -> List[Dict[str, Any]]:
        """
        Poll messages from user's SQS queue using long-polling.
        
        Args:
            max_messages: Maximum messages to retrieve (1-10)
            wait_seconds: Long-polling wait time (0-20 seconds)
        
        Returns:
            List of messages with metadata only (no secrets)
        
        Raises:
            ClientError: If SQS access fails
        """
        try:
            response = self.sqs.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=min(max_messages, 10),
                WaitTimeSeconds=min(wait_seconds, 20),
                MessageAttributeNames=['All']
            )
            
            messages = []
            for msg in response.get('Messages', []):
                try:
                    body = json.loads(msg['Body'])
                    messages.append({
                        'message_id': msg['MessageId'],
                        'receipt_handle': msg['ReceiptHandle'],
                        'relay_id': body.get('relay_id'),
                        'event_id': body.get('event_id'),
                        'tool': body.get('tool'),
                        'event_type': body.get('event_type'),
                        'timestamp': body.get('timestamp'),
                        'metadata': body.get('metadata', {})
                    })
                except json.JSONDecodeError:
                    # Skip malformed messages
                    continue
            
            return messages
        
        except ClientError as e:
            raise Exception(f"Failed to poll SQS queue: {e}")
    
    async def send_message(self, message: Dict[str, Any]) -> str:
        """
        Send routing decision back to user's SQS queue.
        
        Args:
            message: Routing decision dict
        
        Returns:
            Message ID from SQS
        
        Raises:
            ClientError: If send fails
        """
        try:
            response = self.sqs.send_message(
                QueueUrl=self.queue_url,
                MessageBody=json.dumps(message)
            )
            return response['MessageId']
        
        except ClientError as e:
            raise Exception(f"Failed to send SQS message: {e}")
    
    async def delete_message(self, receipt_handle: str) -> bool:
        """
        Delete message from SQS queue after processing.
        
        Args:
            receipt_handle: SQS receipt handle
        
        Returns:
            True if deleted
        
        Raises:
            ClientError: If deletion fails
        """
        try:
            self.sqs.delete_message(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle
            )
            return True
        
        except ClientError as e:
            raise Exception(f"Failed to delete SQS message: {e}")
    
    async def verify_access(self) -> bool:
        """
        Verify provider has required SQS permissions.
        
        Checks:
        - Queue exists and is accessible
        - Can retrieve queue attributes
        
        Returns:
            True if access verified
        
        Raises:
            Exception: If access check fails
        """
        try:
            # Try to get queue attributes (read permission)
            self.sqs.get_queue_attributes(
                QueueUrl=self.queue_url,
                AttributeNames=['All']
            )
            return True
        
        except ClientError as e:
            raise Exception(f"SQS access verification failed: {e}")
    
    async def get_queue_attributes(self) -> Dict[str, Any]:
        """
        Get SQS queue metadata for monitoring.
        
        Returns:
            Dict with queue attributes (message count, etc.)
        
        Raises:
            ClientError: If retrieval fails
        """
        try:
            response = self.sqs.get_queue_attributes(
                QueueUrl=self.queue_url,
                AttributeNames=['All']
            )
            
            attrs = response.get('Attributes', {})
            return {
                'approximate_message_count': int(attrs.get('ApproximateNumberOfMessages', 0)),
                'approximate_messages_delayed': int(attrs.get('ApproximateNumberOfMessagesDelayed', 0)),
                'approximate_messages_not_visible': int(attrs.get('ApproximateNumberOfMessagesNotVisible', 0)),
                'created_timestamp': attrs.get('CreatedTimestamp'),
                'queue_arn': attrs.get('QueueArn'),
                'region': self.region
            }
        
        except ClientError as e:
            raise Exception(f"Failed to get SQS attributes: {e}")
