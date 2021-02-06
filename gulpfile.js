// ==========================================
// 1. DEPENDENCIES
// ==========================================
// gulp-dev-dependencies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'development';

const gulp = require('gulp');
// check package.json for gulp plugins
const gulpLoadPlugins = require('gulp-load-plugins');

// dev-dependencies
const browserSync = require('browser-sync').create();
const del = require('del');
const fs = require('fs');
const rollup = require('rollup').rollup;
const rollupNodeResolve = require('rollup-plugin-node-resolve');
const rollupBabel = require('rollup-plugin-babel');
const rollupJson = require('rollup-plugin-json');
const postcssAutoprefixer = require('autoprefixer');
const postcssCssnano = require('cssnano');
const mapStream = require('map-stream');
const latinize = require('latinize');
const slugify = require('slugify');
const slugifyCustomDefaultSettings = {
  replacement: '-',  // replace spaces with replacement character, defaults to `-`
  remove: /[*+~.()'"!:@]/g, // remove characters that match regex, defaults to `undefined`
  lower: true,      // convert to lower case, defaults to `false`
  strict: true,     // strip special characters except replacement, defaults to `false`
  locale: 'cs'       // language code of the locale to use
};
const Jimp = require('jimp');


const path = require('path');

const pkg = require('./package.json');

const $ = gulpLoadPlugins();

const version = pkg.version;

const ftpSettings = require('./ftp.json');
const ftp = require( 'vinyl-ftp' );
const changed = require('gulp-changed');

const {google} = require('googleapis');

// ==========================================
// 2. FUNCTIONS
// ==========================================

const makeCzechDateFromYMD = (dateString) => {

  return dateString.split("-").reverse().join(". ");
};

const makeCzechDateTimeFromYMDT = (dateTimeString) => {
  const [date, time] = dateTimeString.split(' ');
  return { time, date: makeCzechDateFromYMD(date) };
};


function fileContents(filePath, file) {
  return file.contents.toString();
}

const getCleanUpJSONFromImgTags = (jsonString, pattern = '<img[^<]+>') => {

  return jsonString.replace(new RegExp(pattern, "gmi"), '');

};

const reloadBrowserSync = () => browserSync.reload({stream: true});

// ==========================================
// CONFIG
// ==========================================
const config = {

  // COMMAND ARGUMENTS
  cmd: {
    // check if 'gulp --production'
    // http://stackoverflow.com/questions/28538918/pass-parameter-to-gulp-task#answer-32937333
    production: process.argv.indexOf('--production') > -1 || false,
    // cviceni: {
    //   index: process.argv.indexOf('--cviceni') || false,
    //   value: config.cmd.cviceni.index > -1 ? process.argv[config.cmd.cviceni.index + 1] : false,
    // },
  },
  // FOLDERS
  src: {
    folder: 'src/',
    data: {
      folder: 'src/data/',
      json: 'src/data/**/*.json',
      bundle: 'src/data/cviceni.json',
    },
    fonts: {
      folder: 'src/fonts/',
      files: 'src/fonts/**/*.*',
    },
    img: {
      folder: 'src/img/',
      files: 'src/img/**/*.{jpg,png,svg,gif}',
    },
    js: {
      app: 'src/js/app.js',
      components: 'src/js/components/components.js',
      files: 'src/js/**/*.js',
      library: 'src/js/lib/',
      vendorFiles: 'src/js/vendor/**/*.js',
    },
    pug: {
      views: 'src/views/**/*.pug',
      index: 'src/views/index.pug',
      partials: 'src/views/_partials/**/*.pug',
    },
    scss: 'src/scss/**/*.scss',
    text: {
      folder: 'src/text/',
      html: 'src/text/**/*.html',
    },
    scaffolding: {
      folder: 'src/scaffolding/',
      data: {
        folder: 'src/scaffolding/data/',
      },
      views: {
        folder: 'src/scaffolding/views/',
        cviceni: {
          folder: 'src/scaffolding/views/cviceni/',
        },
      },
      text: {
        folder: 'src/scaffolding/text/',

      },
    },
  },
  tmp: {
    folder: 'tmp/',
    data: {
      folder: 'tmp/data/',
      cviceni: 'tmp/data/cviceni.json',
    },
    js: {
      folder: 'tmp/js/',
      src: 'tmp/js/**/*.js',
    },
    pug: {
      folder: 'tmp/pug/',
      index: 'tmp/pug/index.pug',
      src: 'tmp/pug/**/*.pug',
    },
  },
  dist: {
    folder: 'dist/',
    audio: 'dist/cviceni/assets/audio/',
    cviceni: 'dist/cviceni/',
    css: 'dist/cviceni/assets/css/',
    fonts: 'dist/cviceni/assets/fonts/',
    img: 'dist/cviceni/assets/img/',
    js: 'dist/cviceni/assets/js/',
    jsVendor: 'dist/cviceni/assets/js/vendor/',
    pdf: 'dist/cviceni/assets/pdf/',
  },
  // plugin settings
  // SERVER
  browserSync: {
    // proxy: 'localhost:' + config.port,
    // port: 3000,
    server: 'dist/',
    files: null,
    // files: 'dist/**/*.*',
    ghostMode: {
      click: true,
      // location: true,
      forms: true,
      scroll: true,
    },
    injectChanges: true,
    logFileChanges: true,
    logLevel: 'info',
    notify: false,
    reloadDelay: 380,
    ui: {
      port: 3001
    }
  },
  // IMAGES
  images: {},
  // PLUMBER
  plumber: {
    errorHandler: $.notify.onError('Error: <%= error.message %>'),
  },
  // POSTCSS
  postcss: {
    plugins: [
      postcssAutoprefixer({
        cascade: true,
        precision: 10,
      }),
      postcssCssnano(),
    ],
  },
  // PUG
  pug: {
    pretty: true
  },
  // ROLLUP
  rollup: {
    bundle: {
      input: 'src/js/app.js',
      plugins: [
        rollupNodeResolve(),
        rollupJson(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/assets/js/app.build.js',
      format: 'iife',
      name: 'mdh',
      sourcemap: true,
    },
  },
  components: {
    bundle: {
      input: 'src/js/components/components.js',
      plugins: [
        rollupNodeResolve(),
        rollupBabel({
          exclude: 'node_modules/**',
        }),
      ],
    },
    output: {
      file: 'dist/cviceni/assets/js/components.build.js',
      format: 'iife',
      name: 'components',
      sourcemap: true,
    }
  },
  // SASS
  sass: {
    errLogToConsole: true,
    outputStyle: 'expanded',
  },
};

config.pug.locals = {
  makeCzechDateFromYMD, makeCzechDateTimeFromYMDT,
};

const appConfigJson = JSON.parse(fs.readFileSync('./app.config.json'));

// ==========================================
// 4. TASKS
// ==========================================
// CLEAN
gulp.task('clean', (done) => {
  return del(['dist'], done);
});

gulp.task('clean-temp', (done) => {
  return del(['temp'], done);
});

gulp.task('clean-temp-data-maps', (done) => {
  return del(['temp/data-maps'], done);
});

// SERVER
gulp.task('serve', (cb) => {

  if (browserSync.active) {
    return;
  }
  browserSync.init(config.browserSync);

  gulp.watch('src/js/**/*.js', gulp.series('js'));
  gulp.watch('src/scss/**/*.scss', gulp.series('sass'));
  gulp.watch(['src/views/**/*.pug']).on('change', gulp.series('pug', browserSync.reload));

  cb();

});



gulp.task('pug', () => {
  return gulp.src(['src/views/*.pug'])
    .pipe(
      $.data(() => JSON.parse(fs.readFileSync('./temp/data_maps_merged.json')))
    )
    .pipe(
      $.data(() => appConfigJson)
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'));
  });


  gulp.task('injectSvg', () => {

    return gulp.src('dist/*.html')
      .pipe($.embedSvg({
        root: 'dist/'
      }))
      .pipe(gulp.dest('./dist'));

  });

// SASS
gulp.task('sass', () => {
  return gulp.src('src/scss/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass(config.sass).on('error', $.sass.logError))
    .pipe($.sourcemaps.write(gulp.dest('dist/assets/css')))
    .pipe($.autoprefixer({
      browsers: ['last 4 versions'],
      cascade: false,
    }))
    .pipe(gulp.dest('dist/assets/css'))
    .pipe(browserSync.stream());
});


gulp.task('js', async () => {
  const bundle = await rollup(config.rollup.bundle);
  bundle.write(config.rollup.output);

  browserSync.reload({stream: true});

});

// IMAGES
gulp.task('images', () => gulp.src('src/images/**/*.{jpg,png,svg,gif}')
    .pipe(gulp.dest('dist/assets/images')));

// FONTS
gulp.task('fonts', () => gulp.src('src/fonts/**/*.*')
    .pipe(gulp.dest('dist/assets/fonts')));


const mergeJson = () => {
  return gulp.src('./data/**/*.json')
  .pipe($.mergeJson({
    fileName: 'data_merged.json',
  }))
  .pipe(gulp.dest('./temp/'));
};

const prepareObjectJsonWithImages = (cb) => {

  const subfolderWithImagesName = 'images';
  const allowedImageExtensions = ['jpg', 'jpeg', 'tif', 'png', 'tiff'];
  const generateThumbnailImages = true;
  const debug = false;

  // create ./temp
  try {
    // first check if directory already exists
    if (!fs.existsSync(`./temp/`)) {
        fs.mkdirSync(`./temp/`);
        console.log("Directory is created.");
    } else {
        console.error("Directory already exists.");
    }
  } catch (err) {
    console.error(err);
  }

  // create new directory in ./temp
  try {
    // first check if directory already exists
    if (!fs.existsSync(`./temp/data-maps/`)) {
        fs.mkdirSync(`./temp/data-maps/`);
        //console.log("Directory is created.");
    } else {
        //console.log("Directory already exists.");
    }
  } catch (err) {
    console.error(err);
  }

  return gulp.src('./data-maps/**/*.json')
  .pipe(mapStream((file, done) => {

    //const allPromises = [];

    const filename = path.basename(file.path, path.extname(file.path));
    const parentFolderName = path.basename(path.dirname(file.path));
    const parentFolderPath = path.dirname(file.path);
    const subfolderWithImagesPath = `${parentFolderPath}${path.sep}${subfolderWithImagesName}`;
    const subfolderImages = fs.readdirSync(subfolderWithImagesPath);

    const objectsJson = JSON.parse(file.contents.toString());

    const objectsNewFeatures = [];

    const statistics = {
      countObjects: objectsJson.features.length,
      countFolders: subfolderImages.length,
      countObjectsHavingFolder: 0,
      iterationsOverObjectsBegin: 0,
      iterationsOverObjectsFinished: 0,
      folderNameUsedForObject: []
    };

    const subfolderImagesNormalized = subfolderImages.map(item => latinize(slugify(item.normalize('NFC'), slugifyCustomDefaultSettings)).toLowerCase());

    objectsJson.features.forEach((mapObject) => {

      if (debug) {
        statistics.iterationsOverObjectsBegin++;
        console.log("/////////////////////////////////////////////////");
        console.log("object start");
      }

      const newMapObjectFeatureItem = mapObject;
      newMapObjectFeatureItem.images = [];

      newMapObjectFeatureItem.properties.slug = latinize(slugify(mapObject.properties.name.normalize('NFC'), slugifyCustomDefaultSettings));

      if (debug) {
        console.log("object start name: " + newMapObjectFeatureItem.properties.slug);
      }

      // if true, it means that the map object has images to display
      // compare it based on the sluggified versions of the object and subfolder names
      const hasObjectFolderWithImagesIndex = subfolderImagesNormalized.indexOf(newMapObjectFeatureItem.properties.slug);

      if ( hasObjectFolderWithImagesIndex > -1 ) {

        if (debug) {
          statistics.countObjectsHavingFolder++;
          statistics.folderNameUsedForObject.push(subfolderImagesNormalized[hasObjectFolderWithImagesIndex]);
        }

        const folderName = subfolderImages[hasObjectFolderWithImagesIndex];

        const thisFilePath = `${subfolderWithImagesPath}${path.sep}${folderName}${path.sep}`;

        // get a file list from the folder
        const subfolderImagesFiles = fs.readdirSync(`${thisFilePath}`);

        // process the images one by one and create object structures
        /// find main image
        /// resize & convert types

        let hasMainPhotoBeenCreated = false;

        subfolderImagesFiles.forEach( (thisFilename) => {

          thisFilename = thisFilename.normalize('NFKD');

          const thisFileImageExtension = path.extname(thisFilename);
          let thisFileImageExtensionWithoutDot = thisFileImageExtension.split('.');

          if (thisFileImageExtensionWithoutDot.length > 1) {
            thisFileImageExtensionWithoutDot = thisFileImageExtensionWithoutDot[1].toLowerCase();
          } else {
            // probably a dot file like .DS_STORE and other
          }

          if (allowedImageExtensions.includes(thisFileImageExtensionWithoutDot)) {

            const thisFilenameOnly = path.basename(thisFilename, thisFileImageExtension);
            const thisFileImagePath = `${thisFilePath}${thisFilename}`;
            const potentialTxtFilePath = `${thisFilePath}${thisFilenameOnly}.txt`;

            const imageObj = {};

            imageObj.name = latinize(slugify(`${thisFilenameOnly}-full.jpg`).toLowerCase());
            imageObj.thumbnail = latinize(slugify(`${thisFilenameOnly}-thumbnail.jpg`).toLowerCase());
            imageObj.galleryThumbnail = latinize(slugify(`${thisFilenameOnly}-gallery-thumbnail.jpg`).toLowerCase());

            // is main?
            // :TODO: define better way to check which photos are main, via naming "hlavni"?
            // :TODO: now, the first image in the stack is the main photo
            imageObj.isMain = false;

            if (!hasMainPhotoBeenCreated) {

              imageObj.isMain = true;
              hasMainPhotoBeenCreated = true;

            }

            if (generateThumbnailImages) {

              try {
                // first check if directory already exists
                if (!fs.existsSync(`./temp/data-maps/${filename}/`)) {
                    fs.mkdirSync(`./temp/data-maps/${filename}/`);
                    //console.log("Directory is created.");
                } else {
                    //console.log("Directory already exists.");
                }
              } catch (err) {
                console.error(err);
              }

              try {
                // first check if directory already exists
                if (!fs.existsSync(`./temp/data-maps/${filename}/${subfolderWithImagesName}/`)) {
                    fs.mkdirSync(`./temp/data-maps/${filename}/${subfolderWithImagesName}/`);
                    //console.log("Directory is created.");
                } else {
                    //console.log("Directory already exists.");
                }
              } catch (err) {
                console.error(err);
              }

              const thisObjectFolderNameForImages = `./temp/data-maps/${filename}/images/${newMapObjectFeatureItem.properties.slug}`;

              try {
                // first check if directory already exists
                if (!fs.existsSync(`${thisObjectFolderNameForImages}${path.sep}`)) {
                    fs.mkdirSync(`${thisObjectFolderNameForImages}${path.sep}`);
                    //console.log("Directory is created.");
                } else {
                    //console.log("Directory already exists.");
                }
              } catch (err) {
                console.error(err);
              }

              // resize, rename original
              Jimp.read(thisFileImagePath)
              .then(image => {

                const imageWidth = image.bitmap.width;

                // check if the original image size is larger than the max full width size defined in the app settings
                if (imageWidth > appConfigJson.appConfig.images.object.full.width) {
                  image.resize(appConfigJson.appConfig.images.object.full.width, Jimp.AUTO); // resize
                }

                return image
                .quality(85) // set JPEG quality
                .write(`${thisObjectFolderNameForImages}${path.sep}${imageObj.name}`); // save

              })
              .then(image => {

                // generate, resize, rename gallery thumbs
                return image
                  .resize(appConfigJson.appConfig.images.object.galleryThumbnail.width, Jimp.AUTO) // resize
                  .quality(80) // set JPEG quality
                  .write(`${thisObjectFolderNameForImages}${path.sep}${imageObj.galleryThumbnail}`); // save
              })
              .then(image => {
                // generate, resize, rename thumbs
                return image
                  .cover(appConfigJson.appConfig.images.object.thumbnail.width, appConfigJson.appConfig.images.object.thumbnail.height) // resize
                  .quality(80) // set JPEG quality
                  .write(`${thisObjectFolderNameForImages}${path.sep}${imageObj.thumbnail}`); // save
              })
              .catch(err => {
                console.error(err);
              });

            }

            // description
            if (fs.existsSync(potentialTxtFilePath)) {
              // found txt file
              const textData = fs.readFileSync(potentialTxtFilePath, {encoding:'utf8', flag:'r'});
              imageObj.description = textData;
            }

            newMapObjectFeatureItem.images.push(imageObj);

          } else {
            //console.log('skipping a file with a not allowed extension, this filename: ' + thisFilename);
          }

        });

      }

      // clean up object
      delete newMapObjectFeatureItem.gx_media_links;

      // add newly created feature item to new features array
      objectsNewFeatures.push(newMapObjectFeatureItem);

      if (debug) {
        statistics.iterationsOverObjectsFinished++;
        console.log("object end");
        console.log("/////////////////////////////////////////////////");
      }

    });


    objectsJson.features = objectsNewFeatures;

    // create final json structure
    const transformedJson = {
      [filename]: objectsJson
    };

    // final cleaning up of the JSON file
    const transformedJsonCleanUp = getCleanUpJSONFromImgTags(JSON.stringify(transformedJson));

    try {
      // first check if directory already exists
      if (!fs.existsSync(`./temp/data-maps/${filename}/`)) {
          fs.mkdirSync(`./temp/data-maps/${filename}/`);
          //console.log("Directory is created.");
      } else {
          //console.log("Directory already exists.");
      }
    } catch (err) {
      console.error(err);
    }

    // write the json structure to the file based on the sluggified map name
    fs.writeFileSync(`./temp/data-maps/${filename}/${filename}.json`, transformedJsonCleanUp, (err) => {
      if (!err) {
          console.log('done');
      }
    });

    if (debug) {
      statistics.folderNameNotUsedForObject = [];
      statistics.folderNameNotUsedForObject = subfolderImagesNormalized.filter(item => !statistics.folderNameUsedForObject.includes(item));

      console.log("statistics");
      console.log(statistics);
    }


    done(null, file);
    cb();

  }));

};
gulp.task('prepareObjectJsonWithImages', gulp.series('clean-temp-data-maps', prepareObjectJsonWithImages));


const mergeMapJson = () => {

  return gulp.src('./temp/data-maps/**/*.json')
  .pipe(mapStream((file, done) => {

    done(null, file);

  }))
  .pipe($.mergeJson({
    fileName: 'data_maps_merged.json',
  }))
  .pipe(gulp.dest('./temp/'));

};

const preparePagesMapDetail = (done) => {

  const data = JSON.parse(fs.readFileSync('./temp/data_maps_merged.json'));

  for (const [key, value] of Object.entries(data)) {

    //  html
     gulp.src('src/views/_templates/map-detail.pug')
      .pipe(
        $.data(
          (file) => value
        )
      )
      .pipe(
        $.data(() => appConfigJson)
      )
      .pipe($.pug(config.pug))
      .pipe($.rename(`${key}.html`))
      .pipe(gulp.dest(`./dist/`));

  }

  done();

};

gulp.task('prepareMapDataAndImages', prepareObjectJsonWithImages);
gulp.task('mergeJson', gulp.series(mergeJson, mergeMapJson));
gulp.task('preparePagesMapDetail',  gulp.series('mergeJson', preparePagesMapDetail));

gulp.task('copyToSrc', (done) => {

  gulp.src(['./temp/data-maps/**/*'])
  .pipe(gulp.dest('./src/data-maps/'));

  done();

});


gulp.task('copyToDist', (done) => {
  gulp.src(['.htaccess'])
  .pipe(gulp.dest('./dist/'));

  gulp.src(['./src/data-maps/**/*'])
  .pipe(gulp.dest('./dist/assets/data-maps/'));


  done();

});


gulp.task('svg', () => {

  const svgs = gulp
    .src('src/images/*.svg')
    .pipe($.svgmin(function (file) {
      const prefix = path.basename(file.relative, path.extname(file.relative));
        return {
            plugins: [{
                cleanupIDs: {
                    prefix: prefix + '-',
                    minify: true
                }
            }]
        };
    }))
    .pipe($.svgstore({ inlineSvg: true }));

  return gulp
    .src('./dist/index.html')
    .pipe($.inject(svgs, { transform: fileContents }))
    .pipe(gulp.dest('./dist'));

});


gulp.task('watch', (cb) => {

  gulp.watch(['src/images/**/*.+(png|jpg|jpeg|gif|svg)'], gulp.series('images'));

  gulp.watch(['data/**/*.json'], gulp.series('mergeJson', 'pug'));

  cb();
});

// GULP:prepare
gulp.task('prepare', gulp.series('prepareMapDataAndImages', 'copyToSrc'));

// GULP:build
gulp.task('build', gulp.series('clean', 'preparePagesMapDetail', 'sass', 'js', 'pug', 'images', 'fonts', 'copyToDist', 'injectSvg'));

// GULP:default
gulp.task('default', gulp.series('build', 'watch', 'serve'));
