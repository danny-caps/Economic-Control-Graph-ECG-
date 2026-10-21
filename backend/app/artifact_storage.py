import logging
import os
from pathlib import Path

import boto3
from botocore.exceptions import BotoCoreError, ClientError

from .elliptic_models import REQUIRED_ARTIFACTS, ArtifactError

LOGGER = logging.getLogger(__name__)


def download_configured_artifacts(destination: Path) -> None:
    bucket = os.environ.get("ECG_ARTIFACTS_S3_BUCKET")
    if not bucket:
        return

    access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    if bool(access_key) != bool(secret_key):
        raise ArtifactError(
            "Set both AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY for S3 artifact storage."
        )

    endpoint_url = os.environ.get("ECG_ARTIFACTS_S3_ENDPOINT_URL") or None
    region_name = os.environ.get("ECG_ARTIFACTS_S3_REGION") or None
    prefix = os.environ.get("ECG_ARTIFACTS_S3_PREFIX", "").strip("/")
    destination.mkdir(parents=True, exist_ok=True)

    client = boto3.client(
        "s3",
        endpoint_url=endpoint_url,
        region_name=region_name,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
    )
    for artifact_name in REQUIRED_ARTIFACTS:
        object_key = f"{prefix}/{artifact_name}" if prefix else artifact_name
        artifact_path = destination / artifact_name
        partial_path = artifact_path.with_suffix(artifact_path.suffix + ".download")
        try:
            client.download_file(bucket, object_key, str(partial_path))
            partial_path.replace(artifact_path)
        except (BotoCoreError, ClientError, OSError) as error:
            partial_path.unlink(missing_ok=True)
            raise ArtifactError(
                f"Could not download model artifact {object_key!r} "
                f"from S3 bucket {bucket!r}: {error}"
            ) from error

    LOGGER.info(
        "Downloaded %d Elliptic artifacts from bucket %s to %s.",
        len(REQUIRED_ARTIFACTS),
        bucket,
        destination,
    )
