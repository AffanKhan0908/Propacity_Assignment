const { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const fs = require('fs');
const path = require('path');

// Configure AWS SDK with your credentials and S3 bucket name
const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: 'AKIAR3S45MUYNDAWJZ55',
    secretAccessKey: '3vWAxNLKiUzLYgxBOYza12+CW0hdI1XtRsHiOmQs',
  },
});

// Function to upload a file or all files in a directory to S3
async function uploadFile(localFilePath) {
  const stats = fs.statSync(localFilePath);

  if (stats.isDirectory()) {
    // If localFilePath is a directory, upload all files within the directory
    const files = fs.readdirSync(localFilePath);

    const uploadPromises = files.map(async (file) => {
      const filePath = path.join(localFilePath, file);
      const fileStream = fs.createReadStream(filePath);
      const s3Key = path.join(path.basename(localFilePath), file);

      const uploadParams = {
        Bucket: 'assignmentfilemanager',
        Key: s3Key,
        Body: fileStream,
      };

      return s3.send(new PutObjectCommand(uploadParams));
    });

    return Promise.all(uploadPromises);
  } else {
    // If localFilePath is a file, upload the file
    const fileStream = fs.createReadStream(localFilePath);
    const s3Key = path.basename(localFilePath);

    const uploadParams = {
      Bucket: 'assignmentfilemanager',
      Key: s3Key,
      Body: fileStream,
    };

    return s3.send(new PutObjectCommand(uploadParams));
  }
}

// Function to download a file from S3
async function downloadFile(s3Key, localFilePath) {
  const downloadParams = {
    Bucket: 'assignmentfilemanager',
    Key: s3Key,
  };

  const data = await s3.send(new GetObjectCommand(downloadParams));
  const bodyStream = Readable.from(data.Body);

  return new Promise((resolve, reject) => {
    const writeStream = fs.createWriteStream(localFilePath);
    bodyStream.pipe(writeStream);

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
}

// Function to list files in the S3 bucket
async function listFiles() {
  const listParams = {
    Bucket: 'assignmentfilemanager',
  };

  const data = await s3.send(new ListObjectsCommand(listParams));
  return data.Contents.map((item) => item.Key);
}

// Example usage
async function main() {
  const localFilePath = 'E:\\uploadfile';

  // Upload file or all files in a directory
  await uploadFile(localFilePath);
  console.log('File(s) uploaded successfully.');

  // List files
  const files = await listFiles();
  console.log('Files in the S3 bucket:', files);

  // Download file
  const s3Key = path.basename(localFilePath);
  const downloadedFilePath = 'E:\\uploadfile';
  await downloadFile(s3Key, downloadedFilePath);
  console.log('File downloaded successfully.');
}

main().catch((error) => console.error('Error:', error));
