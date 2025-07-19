const AWS = require('aws-sdk');
const dotenv = require('dotenv');

// Load environment variables (important if this utility is used independently of server.js)
dotenv.config({ path: '../.env' }); // Adjust path if needed based on where this file is called from

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
});

const uploadFile = async (fileBuffer, fileName, mimetype) => {
    const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: `${Date.now()}-${fileName.replace(/\s/g, '_')}`, // Unique file name
        Body: fileBuffer,
        ContentType: mimetype,
        ACL: 'private', // Keep private for security, use presigned URLs for access
        // Or if you want public access (less secure for sensitive docs):
        // ACL: 'public-read', // Make the file publicly readable
    };

    try {
        const data = await s3.upload(uploadParams).promise();
        return data.Location; // Returns the public URL of the uploaded file
    } catch (error) {
        console.error('Error uploading file to S3:', error);
        throw new Error('Failed to upload file to S3');
    }
};

const deleteFile = async (fileUrl) => {
    // Extract key from the URL (this assumes the URL format is consistent)
    const bucketName = process.env.AWS_BUCKET_NAME;
    const region = process.env.AWS_BUCKET_REGION;
    // Example URL: https://your-bucket-name.s3.your-region.amazonaws.com/your-file-key
    const key = fileUrl.split(`https://${bucketName}.s3.${region}.amazonaws.com/`)[1];

    if (!key) {
        console.warn(`Could not extract S3 key from URL: ${fileUrl}`);
        return; // Or throw an error if you want strict checking
    }

    const deleteParams = {
        Bucket: bucketName,
        Key: key,
    };

    try {
        await s3.deleteObject(deleteParams).promise();
        console.log(`File ${key} deleted from S3`);
    } catch (error) {
        console.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete file from S3');
    }
};


module.exports = {
    uploadFile,
    deleteFile,
};