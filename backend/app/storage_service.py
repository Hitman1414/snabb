import os
import shutil
import logging
import uuid
from typing import BinaryIO
from .config import settings

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        self.provider = settings.STORAGE_PROVIDER.lower()
        self.local_upload_dir = "static/uploads"
        
        if self.provider == "local":
            os.makedirs(self.local_upload_dir, exist_ok=True)
            logger.info(f"💾 StorageService initialized with local provider at {self.local_upload_dir}")
        elif self.provider == "s3":
            try:
                import boto3
                from botocore.exceptions import NoCredentialsError
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION_NAME
                )
                self.s3_bucket = settings.AWS_BUCKET_NAME
                logger.info(f"☁️ StorageService initialized with AWS S3 provider (Bucket: {self.s3_bucket})")
            except ImportError:
                logger.error("boto3 is not installed. Please install it using `pip install boto3`.")
                self.provider = "local" # Fallback
                os.makedirs(self.local_upload_dir, exist_ok=True)

    def upload_file(self, file_obj: BinaryIO, filename: str, content_type: str) -> str:
        """
        Uploads a file and returns the public URL.
        Generated filenames are given unique identifiers to prevent overwriting.
        """
        # Create a unique filename string
        unique_filename = f"{str(uuid.uuid4().hex)[:8]}_{filename}"

        if self.provider == "local":
            file_path = os.path.join(self.local_upload_dir, unique_filename)
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file_obj, buffer)
            
            # Construct the full localhost or production domain URL for local files
            # Usually handled by the frontend, but we store the relative path
            return f"/static/uploads/{unique_filename}"
            
        elif self.provider == "s3":
            try:
                # Actual S3 upload
                self.s3_client.upload_fileobj(
                    file_obj, 
                    self.s3_bucket, 
                    unique_filename,
                    ExtraArgs={
                        'ContentType': content_type,
                        # If block public access is not entirely turned off, 'public-read' ACL might fail. 
                        # Assuming the bucket allows public ACLs or uses a CDN policy:
                        # 'ACL': 'public-read' 
                    }
                )
                
                # Check if a custom CDN maps to this bucket, otherwise use the default S3 URL pattern
                if settings.IMAGE_CDN_URL:
                    return f"{settings.IMAGE_CDN_URL}/{unique_filename}"
                else:
                    return f"https://{self.s3_bucket}.s3.{settings.AWS_REGION_NAME}.amazonaws.com/{unique_filename}"
                    
            except Exception as e:
                logger.error(f"❌ Failed to upload '{unique_filename}' to S3: {e}")
                # Optional: Graceful fallback to local if S3 fails
                # return self._fallback_local_upload(file_obj, unique_filename)
                raise e
            
        return ""

storage = StorageService()
