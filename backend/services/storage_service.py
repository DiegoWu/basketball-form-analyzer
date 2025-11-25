import os
from pathlib import Path
from google.cloud import storage
from datetime import datetime, timedelta
from dotenv import load_dotenv
import uuid
from typing import Optional

load_dotenv()

class StorageService:
    """Service for uploading files to Google Cloud Storage"""
    
    def __init__(self):
        self.bucket_name = os.environ.get('GCS_BUCKET_NAME')
        self.project_id = os.environ.get('GCP_PROJECT_ID')
        
        #Check if service account credentials are available
        self.credentials_path = os.environ.get('GOOGLE_APPLICATION_CREDENTIALS')
        if self.credentials_path:
            print(f"Using service account: {self.credentials_path}")
        else:
            print(f"No service account found, using default credentials")
        
        self._client = None
        self._bucket = None

    @property
    def client(self):
        """Lazy initialization of GCS client"""
        if self._client is None:
            # Client will automatically use GOOGLE_APPLICATION_CREDENTIALS if set
            self._client = storage.Client(project=self.project_id)
            print(f"Connected to GCS project: {self.project_id}")
        return self._client

    @property
    def bucket(self):
        """Lazy initialization of GCS bucket"""
        if self._bucket is None:
            self._bucket = self.client.bucket(self.bucket_name)
            print(f"Connected to GCS bucket: {self.bucket_name}")
        return self._bucket
    
    def _can_generate_signed_urls(self) -> bool:
        """Check if we can generate signed URLs (requires service account)"""
        try:
            # Try to access service account email (only available with service account creds)
            _ = self.client._credentials.service_account_email
            return True
        except AttributeError:
            return False
    
    def upload_file(
        self, 
        local_file_path: str, 
        destination_folder: str = 'results',
        content_type: Optional[str] = None,
        make_public: bool = True,
        url_expiration_days: int = 7
    ) -> str:
        """
        Upload file to Google Cloud Storage and return accessible URL
        """
        try:
            if not os.path.exists(local_file_path):
                raise FileNotFoundError(f"File not found: {local_file_path}")
            
            # Generate unique filename
            file_extension = Path(local_file_path).suffix
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            unique_id = uuid.uuid4().hex[:8]
            filename = f"{timestamp}_{unique_id}{file_extension}"
            blob_name = f"{destination_folder}/{filename}"
            
            # Create blob and upload
            blob = self.bucket.blob(blob_name)
            
            # Set content type
            if content_type:
                blob.content_type = content_type
            elif file_extension == '.mp4':
                blob.content_type = 'video/mp4'
            elif file_extension == '.png':
                blob.content_type = 'image/png'
            elif file_extension in ['.jpg', '.jpeg']:
                blob.content_type = 'image/jpeg'
            
            # Upload file
            blob.upload_from_filename(local_file_path)
            
            # Try to generate signed URL if we have service account credentials
            if self._can_generate_signed_urls():
                try:
                    url = blob.generate_signed_url(
                        version="v4",
                        expiration=timedelta(days=url_expiration_days),
                        method="GET"
                    )
                    print(f"Uploaded: {local_file_path}")
                    print(f"   → {blob_name}")
                    print(f"   📎 Signed URL (valid for {url_expiration_days} days)")
                    return url
                except Exception as e:
                    print(f"Failed to generate signed URL: {e}")
                    print(f"   Falling back to public URL")
            
            # Fallback: Use public URL (requires bucket to be public)
            public_url = f"https://storage.googleapis.com/{self.bucket_name}/{blob_name}"
            print(f"Uploaded: {local_file_path}")
            print(f"   → {public_url}")
            print(f"Using public URL (bucket must be public)")
            
            return public_url
            
        except Exception as e:
            print(f"Upload failed for {local_file_path}: {e}")
            raise
    
    def upload_comparison_image(self, local_path: str) -> str:
        """Upload comparison visualization image"""
        return self.upload_file(
            local_path, 
            destination_folder='comparison-images',
            content_type='image/png',
            url_expiration_days=7
        )
    
    def upload_analyzed_video(self, local_path: str) -> str:
        """Upload analyzed video with pose overlay"""
        return self.upload_file(
            local_path,
            destination_folder='analyzed-videos',
            content_type='video/mp4',
            url_expiration_days=7
        )
    
    def delete_file(self, blob_name: str):
        """Delete file from GCS"""
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            print(f"Deleted: {blob_name}")
        except Exception as e:
            print(f"Delete failed for {blob_name}: {e}")
    
    def cleanup_old_files(self, max_age_days: int = 7):
        """Delete files older than max_age_days"""
        try:
            cutoff_date = datetime.now() - timedelta(days=max_age_days)
            blobs = self.bucket.list_blobs()
            
            deleted_count = 0
            for blob in blobs:
                if blob.time_created.replace(tzinfo=None) < cutoff_date:
                    print(f"Deleting old file: {blob.name}")
                    blob.delete()
                    deleted_count += 1
            
            print(f"Cleaned up {deleted_count} old files")
        except Exception as e:
            print(f"Cleanup failed: {e}")

# Singleton instance
storage_service = StorageService()