import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.artifact_storage import download_configured_artifacts
from app.elliptic_models import ArtifactError, REQUIRED_ARTIFACTS


class ArtifactStorageTests(unittest.TestCase):
    def test_skips_download_when_bucket_is_not_configured(self):
        with patch.dict(os.environ, {}, clear=True), patch(
            "app.artifact_storage.boto3.client"
        ) as client_factory:
            download_configured_artifacts(Path("unused-artifact-directory"))

        client_factory.assert_not_called()

    def test_downloads_each_required_artifact_from_configured_prefix(self):
        class FakeS3Client:
            def download_file(self, bucket, object_key, filename):
                self.asserted_downloads.append((bucket, object_key))
                Path(filename).write_text(object_key, encoding="utf-8")

            def __init__(self):
                self.asserted_downloads = []

        client = FakeS3Client()
        with tempfile.TemporaryDirectory() as temp_dir, patch.dict(
            os.environ,
            {
                "ECG_ARTIFACTS_S3_BUCKET": "model-bucket",
                "ECG_ARTIFACTS_S3_PREFIX": "elliptic/",
                "ECG_ARTIFACTS_S3_REGION": "us-east-1",
                "AWS_ACCESS_KEY_ID": "access",
                "AWS_SECRET_ACCESS_KEY": "secret",
            },
            clear=True,
        ), patch("app.artifact_storage.boto3.client", return_value=client):
            destination = Path(temp_dir) / "artifacts"
            download_configured_artifacts(destination)
            self.assertEqual(
                client.asserted_downloads,
                [
                    ("model-bucket", f"elliptic/{name}")
                    for name in REQUIRED_ARTIFACTS
                ],
            )
            for name in REQUIRED_ARTIFACTS:
                self.assertEqual(
                    (destination / name).read_text(encoding="utf-8"),
                    f"elliptic/{name}",
                )

    def test_rejects_incomplete_explicit_credentials(self):
        with patch.dict(
            os.environ,
            {"ECG_ARTIFACTS_S3_BUCKET": "model-bucket", "AWS_ACCESS_KEY_ID": "access"},
            clear=True,
        ):
            with self.assertRaisesRegex(ArtifactError, "Set both"):
                download_configured_artifacts(Path("unused-artifact-directory"))


if __name__ == "__main__":
    unittest.main()
