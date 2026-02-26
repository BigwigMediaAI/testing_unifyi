import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION"),
)

BUCKET_NAME = os.getenv("AWS_BUCKET_NAME")


def upload_file_to_s3(file_bytes, file_name, content_type):
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=file_name,
        Body=file_bytes,
        ContentType=content_type
    )

    file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{file_name}"
    return file_url