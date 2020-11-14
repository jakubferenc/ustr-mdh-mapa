// ==========================================
// 1. DEPENDENCIES
// ==========================================
// gulp-dev-dependencies
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
const slugify = require('slugify');
const slugifyCustomDefaultSettings = {
  replacement: '-',  // replace spaces with replacement character, defaults to `-`
  remove: undefined, // remove characters that match regex, defaults to `undefined`
  lower: true,      // convert to lower case, defaults to `false`
  strict: false,     // strip special characters except replacement, defaults to `false`
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

function startBrowserSync() {
  if (browserSync.active) {
    return;
  }
  browserSync.init(config.browserSync);
}

function fileContents(filePath, file) {
  return file.contents.toString();
}

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
gulp.task('serve', () => {
  return startBrowserSync();
});

gulp.task('reload', () => {
  return browserSync.reload();
});

// pug:index & pug:home (pug -> html)
gulp.task('pug', () => {
  return gulp.src(['src/views/index.pug'])
    .pipe(
      $.data(() => JSON.parse(fs.readFileSync('./temp/data_maps_merged.json')))
    )
    .pipe(
      $.data(() => appConfigJson)
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({
      stream: true,
    }));
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
    .pipe(browserSync.reload({
      stream: true,
    }));
});


gulp.task('js', async () => {
  const bundle = await rollup(config.rollup.bundle);
  bundle.write(config.rollup.output);

  browserSync.reload({
    stream: true,
  });

});

// IMAGES
gulp.task('images', () => gulp.src('src/images/**/*.{jpg,png,svg,gif}')
    .pipe(gulp.dest('dist/assets/images')));

// FONTS
gulp.task('fonts', () => gulp.src('src/fonts/**/*.*')
    .pipe(gulp.dest('dist/assets/fonts')));


const mergeJsonFunc = () => {
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

  return gulp.src('./data-maps/**/*.json')
  .pipe(mapStream((file, done) => {

    const filename = path.basename(file.path, path.extname(file.path));
    const parentFolderName = path.basename(path.dirname(file.path));
    const parentFolderPath = path.dirname(file.path);
    const subfolderWithImagesPath = `${parentFolderPath}${path.sep}${subfolderWithImagesName}`;
    const subfolderImages = fs.readdirSync(subfolderWithImagesPath);

    const objectsJson = JSON.parse(file.contents.toString());

    const objectsNewFeatures = [];

    objectsJson.features.forEach((mapObject) => {

      const newMapObjectFeatureItem = mapObject
      newMapObjectFeatureItem.images = [];

      newMapObjectFeatureItem.properties.slug = slugify(mapObject.properties.name, slugifyCustomDefaultSettings);

      // check if a folder with the object images exists
      try {

        subfolderImages.forEach( (folderName) => {

          const folderNameSlug = slugify(folderName, slugifyCustomDefaultSettings);

          if ( newMapObjectFeatureItem.properties.slug === folderNameSlug) {

            // get actual files from the folder
            const subfolderImagesFiles = fs.readdirSync(`${subfolderWithImagesPath}${path.sep}${folderName}`);

            // process the images one by one and create object structures
            /// find main image
            /// resize & convert types
            const thisFilePath = `${subfolderWithImagesPath}${path.sep}${folderName}${path.sep}`;

            const hasMainPhotoBeenCreated = false;

            subfolderImagesFiles.forEach( (thisFilename) => {

              let thisFileImageExtensionWithoutDot = path.extname(thisFilename).split('.');

              if (thisFileImageExtensionWithoutDot.length > 1) {
                thisFileImageExtensionWithoutDot = thisFileImageExtensionWithoutDot[1].toLowerCase();
              } else {
                return; // probably a dot file like .DS_STORE and other
              }

              if (allowedImageExtensions.includes(thisFileImageExtensionWithoutDot)) {

                const thisFilenameOnly = thisFilename.split('.')[0];
                const thisFileImagePath = `${thisFilePath}${thisFilename}`;
                const potentialTxtFilePath = `${thisFilePath}${thisFilenameOnly}.txt`;

                const imageObj = {};

                imageObj.name = thisFilename;
                imageObj.thumbnail = `${thisFilename}-thumbnail.jpg`;
                imageObj.galleryThumbnail = `${thisFilename}-gallery-thumbnail.jpg`;

                // is main?
                // :TODO: define better way to check which photos are main, via naming "hlavni"?
                // :TODO: now, the first image in the stack is the main photo
                imageObj.isMain = false;

                if (!hasMainPhotoBeenCreated) {

                  imageObj.isMain = true;

                }

                if (generateThumbnailImages) {

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
                    console.log(err);
                  }

                  try {
                    // first check if directory already exists
                    if (!fs.existsSync(`./temp/data-maps/${filename}/`)) {
                        fs.mkdirSync(`./temp/data-maps/${filename}/`);
                        //console.log("Directory is created.");
                    } else {
                        //console.log("Directory already exists.");
                    }
                  } catch (err) {
                    console.log(err);
                  }

                  const thisObjectFolderNameForImages = `./temp/data-maps/${filename}/${newMapObjectFeatureItem.properties.slug}`;

                  try {
                    // first check if directory already exists
                    if (!fs.existsSync(`${thisObjectFolderNameForImages}${path.sep}`)) {
                        fs.mkdirSync(`${thisObjectFolderNameForImages}${path.sep}`);
                        //console.log("Directory is created.");
                    } else {
                        //console.log("Directory already exists.");
                    }
                  } catch (err) {
                    console.log(err);
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
                    .quality(80) // set JPEG quality
                    .write(`${thisObjectFolderNameForImages}${path.sep}${thisFilenameOnly}.jpg`); // save

                  })
                  .catch(err => {
                    console.error(err);
                  });

                  // generate, esize, rename thumbs
                  Jimp.read(thisFileImagePath)
                  .then(image => {
                    return image
                      .resize(appConfigJson.appConfig.images.object.thumbnail.width, appConfigJson.appConfig.images.object.thumbnail.height) // resize
                      .quality(80) // set JPEG quality
                      .write(`${thisObjectFolderNameForImages}${path.sep}${imageObj.thumbnail}`); // save
                  })
                  .catch(err => {
                    console.error(err);
                  });

                  // generate, resize, rename gallery thumbs
                  Jimp.read(thisFileImagePath)
                  .then(image => {
                    return image
                      .resize(appConfigJson.appConfig.images.object.galleryThumbnail.width, appConfigJson.appConfig.images.object.galleryThumbnail.height) // resize
                      .quality(80) // set JPEG quality
                      .write(`${thisObjectFolderNameForImages}${path.sep}${imageObj.galleryThumbnail}`); // save
                  })
                  .catch(err => {
                    console.error(err);
                  });

                }

                // description
                if (fs.existsSync(potentialTxtFilePath)) {
                  // found txt file
                  const data = fs.readFileSync(potentialTxtFilePath, {encoding:'utf8', flag:'r'});
                  imageObj.description = data;
                }

                newMapObjectFeatureItem.images.push(imageObj);


              } else {
                console.log('skipping a file with a not allowed extension, this filename: ' + thisFilename);
              }

            });

            return; // we have found the folderName equal to objectName, jump out of the loop
          }

        });


      } catch (err) {
          console.log(err);
      }

      // add newly created feature item to new features array
      objectsNewFeatures.push(newMapObjectFeatureItem);

    });

    objectsJson.features = objectsNewFeatures;

    // create final json structure
    const transformedJson = {
      [filename]: objectsJson
    };

    // create new directory in ./temp
    try {
      // first check if directory already exists
      if (!fs.existsSync(`./temp/data-maps/`)) {
          fs.mkdirSync(`./temp/data-maps/`);
          console.log("Directory is created.");
      } else {
          console.log("Directory already exists.");
      }
    } catch (err) {
      console.log(err);
    }

    try {
      // first check if directory already exists
      if (!fs.existsSync(`./temp/data-maps/${filename}/`)) {
          fs.mkdirSync(`./temp/data-maps/${filename}/`);
          console.log("Directory is created.");
      } else {
          console.log("Directory already exists.");
      }
    } catch (err) {
      console.log(err);
    }

    fs.writeFile(`./temp/data-maps/${filename}/${filename}.json`, JSON.stringify(transformedJson), (err) => {
      if (!err) {
          console.log('done');
      }
    });


    done(null, file);
    cb();

  }))

};
gulp.task('prepareObjectJsonWithImages', gulp.series('clean-temp-data-maps', prepareObjectJsonWithImages));


const mergeMapJson = () => {

  return gulp.src('./data-maps/**/*.json')
  .pipe(mapStream((file, done) => {

    const filename = path.basename(file.path, path.extname(file.path));

    const json = JSON.parse(file.contents.toString());
    json.slug = slugify(filename, slugifyCustomDefaultSettings);
    const transformedJson = {
      [filename]: json
    };
    file.contents = new Buffer.from(JSON.stringify(transformedJson));

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

gulp.task('mergeJson', gulp.series('clean-temp', mergeJsonFunc, mergeMapJson));

gulp.task('preparePagesMapDetail',  gulp.series('mergeJson', preparePagesMapDetail));



gulp.task('copyToDist', () => {
  return gulp.src('.htaccess')
  .pipe(gulp.dest('./dist/'));
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
  gulp.watch(['site.webmanifest'], gulp.series('pug'));
  gulp.watch('src/js/**/*.js', gulp.series('js'));
  gulp.watch('src/scss/**/*.scss', gulp.series('sass'));
  gulp.watch(['src/views/**/*.pug'], gulp.series('pug'));
  gulp.watch('src/*.html', gulp.series(browserSync.reload));
  gulp.watch(['src/images/**/*.+(png|jpg|jpeg|gif|svg)'], gulp.series('images'));
  gulp.watch(['src/views/**/*.pug'], gulp.series('pug'));
  gulp.watch('app.config.json', gulp.series('pug'));
  gulp.watch(['data/**/*.json'], gulp.series('mergeJson', 'pug'));
  cb();
});

// GULP:build
gulp.task('build', gulp.series('clean', 'mergeJson', 'sass', 'js', 'images', 'fonts', 'preparePagesMapDetail', 'copyToDist', 'injectSvg'));

// GULP:default
gulp.task('default', gulp.series('build', 'watch', 'serve'));
