

const fs = require('fs'),
  AWS = require('aws-sdk'),
  Sharp = require('sharp'),
  multer = require('multer'),
  smartcrop = require('smartcrop-sharp'),

  helper = require('./helper'),
  CONSTANT = require('./constants');
// http://docs.aws.amazon.com/AWSJavaScriptSDK/guide/node-configuring.html#Credentials_from_Disk
AWS.config.loadFromPath('./aws-config.json');

// assume you already have the S3 Bucket created, and it is called ierg4210-shopxx-photos
const S3Bucket = new AWS.S3({ params: { Bucket: CONSTANT.BUCKET_NAME } });

module.exports = (route) => {

  /** ------------------------
   *  HEAL CHECK SERVER
   * -----------------------*/
  route.get('/ping', (req, res) => {
    return res.status(200).json({ message: 'pong' })
  })

  /** ------------------------
  * GET LIST BUCKET
  * ------------------------*/
  route.get('/list-bucket', (req, res) => {
    S3Bucket.listBuckets({}, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: 'Server have some thing wrong', error: err });
      }
      return res.status(200).json({ status: true, messge: 'upload message', data });
    });
  })


  /***------------------------
   * GET LIST OBJECT
   *------------------------*/
  route.get('/list-object', (req, res) => {
    let params = {
      Bucket: req.query.Bucket,
      Delimiter: req.query.Delimiter,
      Marker: req.query.Marker,
      MaxKeys: req.query.MaxKeys,
      Prefix: req.query.Prefix,
    }
    S3Bucket.listObjects(params, (err, data) => {
      if (err) {
        return res.status(500).json({ status: false, message: 'Server have some thing wrong', error: err });
      }
      return res.status(200).json({ status: true, messge: 'Upload message', data });
    });
  })

  /** ------------------------
   *  UPLOAD router
   * ------------------------*/
  route.post('/upload', multer({ limits: { fileSize: CONSTANT.MAX_FILE_SIZE * 1024 * 1024 } }), (req, res) => {
    //GET FILES
    let filesUpload = req.files && req.files.files || [];

    //convert to array if have one file request
    if (!Array.isArray(filesUpload)) {
      filesUpload = [filesUpload];
    }
    //VALIDATION FILE
    if (filesUpload.length === 0) {
      return res.status(403).json({ status: false, message: `Files can't empty` });
    }
    if (filesUpload.length > CONSTANT.MAX_FILE_UPLOAD) {
      return res.status(403).json({ status: false, message: `Maximum uploads is ${CONSTANT.MAX_FILE_UPLOAD} files ` });
    }
    for (let file of filesUpload) {
      if (!/^image\/(jpe?g|png|gif)$/i.test(file.mimetype)) {
        return res.status(403).json({ status: false, message: 'Expect image file type = [ *.JPEG, *.PNG, *.GIF, *.JPG ]' });
      }
    }
    //UPLOAD
    let multiUpload = [];

    filesUpload.forEach((file) => {
      let destFileName = helper.generateFileNameDestination(file);
      let contentType = `image/${file.extension}`;
      let bodyImage = fs.createReadStream(file.path);
      multiUpload.push(uploadToS3(bodyImage, destFileName, { contentType }));
    })
    Promise.all(multiUpload).then((URLs) => {
      fileURLNames = URLs.map((url) => {
        return url.Bucket && { path: url.key, url: CONSTANT.URL_WEB_STATIC_S3 + '/' + url.key }
      })
      return res.status(200).json({ status: true, message: 'Image upload success S3', urls: fileURLNames })
    }).catch(err => {
      console.error(err);
      return res.status(500).json({ status: false, message: `Image upload fail S3`, error: err })
    })
  })


  /** ------------------------
  *  RESIZE IMAGES
  * ------------------------*/
  route.get('/resize', (req, res) => {
    //get data
    let key = req.query.key;
    let parseURL = key.match(/(\d+)x(\d+)\/(.*)/);
    //use when url not match with resize
    if (!parseURL) {
      return res.status(404).json({ status: false, message: `Image not found` });
    }
    let [resizeURL, height, width, originURL] = parseURL;
    //convert
    width = parseInt(width, 10);
    height = parseInt(height, 10);
    //validation
    if (typeof height !== 'number' || typeof width !== 'number') {
      return res.status(403).json({ status: false, message: `height and width must be numbers` });
    }
    if (CONSTANT.VALID_SIZE.indexOf(height) < 0 || CONSTANT.VALID_SIZE.indexOf(width) < 0) {
      //return origin image if height and width is not valid
      return res.redirect(CONSTANT.URL_WEB_STATIC_S3 + '/' + originURL);
    }
    //get images from s3
    S3Bucket.getObject({
      Key: resizeURL,
    }, (err) => {
      if (err && err.statusCode !== 404) {
        //return images if already resize path
        return res.redirect(CONSTANT.URL_WEB_STATIC_S3 + '/' + resizeURL);
      } else {
        //resize and upload image if not exist
        resize(height, width, originURL)
          //upload to S3 after resize
          .then(data => uploadToS3(data.buffer, resizeURL, { contentType: data.contentType }))
          //Redirect to HOST_WEBSITE_S3
          .then(() => res.redirect(CONSTANT.URL_WEB_STATIC_S3 + '/' + resizeURL))
          //Catch error
          .catch(err => {
            let errorBuilder = buildErrorMessage(err);
            return res.status(errorBuilder.code).json(errorBuilder.error)
          })
      }
    })
  })
  return route;
}


/**
 * READ IMAGE INFO from buffer
 * let checkImageAndUpload = (file) =>{
  return new Promise((resolve, reject)=>{
    let destFileName = helper.generateFileNameDestination(file);
    let contentType = `image/${file.extension}`;
    let readStream = fs.createReadStream(file.path);
    let transform = sharp();
    // read infor image
    readStream.pipe(transform.metadata((err, infor)=> {
      if (err) {
        return reject(err);
      }
      let maxSize = +CONSTANT.S3.MAX_SIZE_WIDTH_HEIGHT;
      if (infor.height > maxSize) {
        transform = transform.resize(maxSize);
      } else if (infor.width > maxSize) {
        transform = transform.resize(null, maxSize);
      }
      readStream = readStream.pipe(transform);
      return resolve(uploadToS3(readStream, destFileName, { contentType }));
    }));
  });
};
 * 
 */

/** -----------------
 * PRIVATE METHOD
 * -----------------*/

let uploadToS3 = (body, destFileName, options) => {
  options = { ACL: 'public-read', ...options }
  return new Promise((resolve, reject) => {
    S3Bucket
      .upload({
        ACL: options.ACL,
        Body: body,
        Key: destFileName,
        ContentType: options.contentType
      }).send((err, data) => {
        if (err) {
          let errorS3 = { errorS3: true, error: err, message: `${destFileName} is upload fail!` };
          console.error(errorS3)
          return reject(err)
        }
        console.info(`${destFileName} is upload done!`);
        return resolve(data);
      });
  })
}

let resize = (height, width, originalKey) => {
  return new Promise((resolve, reject) => {
    S3Bucket.getObject({ Key: originalKey }, (err, data) => {
      if (err && err.statusCode === 404) {
        let errorS3 = { s3Error: true, code: 404, message: 'Image is not found' }
        console.error(errorS3);
        return reject(errorS3)
      }
      console.info('Get origin images and reszie');
      smartcrop.crop(data.Body, { width: width, height: height }).then((result) => {
        var crop = result.topCrop;
        Sharp(data.Body)
          .extract({ width: crop.width, height: crop.height, left: crop.x, top: crop.y })
          .resize(width, height)
          .toBuffer()
          .then((buffer) => resolve({ buffer: buffer, contentType: data.ContentType }));
      })
    })
  })
}

let buildErrorMessage = (err) => {
  //handle unknow error
  if (!err || (err && !err.s3Error)) {
    console.error(err);
    return helper.message500();
  }
  //handle S3 error
  switch (err.code) {
    case 404: return helper.message404();
  }
}



