module.exports = {
  BUCKET_NAME: process.env.BUCKET_NAME || 'phong-test-images',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 5,
  MAX_FILE_UPLOAD: process.env.MAX_FILE_UPLOAD || 2,
  URL_WEB_STATIC_S3: process.env.URL_WEB_STATIC_S3 || 'http://phong-test-images.s3-website-us-east-1.amazonaws.com',
  VALID_SIZE: process.env.VALID_SIZE || [100,200,300,400,500,600,700,800,900]
}
