// ==========================================
// 0. DEPENDENCIES
// ==========================================

// node libraries
import fs, { truncate } from 'fs';
//import { copyFile } from 'fs/promises';
import { copyFile } from 'fs';
import del from 'del';
import path, { resolve } from 'path';


// gulp-dev-dependencies
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';

import {rollup} from 'rollup';
import rollupNodeResolve from '@rollup/plugin-node-resolve';
import rollupBabel from '@rollup/plugin-babel';
import rollupJson from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';

import slugify from 'slugify';
import latinize from 'latinize';
import mapStream from 'map-stream';

import browserSync from 'browser-sync';

import postcssAutoprefixer from 'autoprefixer';
import postcssCssnano from 'cssnano';

const sharp = require('sharp');


// ==========================================
// 0. INITIALIZATION
// ==========================================

// node environment
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
process.env.NODE_ENV = 'development';


// dev-dependencies
const slugifyCustomDefaultSettings = {
  replacement: '-',  // replace spaces with replacement character, defaults to `-`
  remove: /[*+~.()'"!:@]/g, // remove characters that match regex, defaults to `undefined`
  lower: true,      // convert to lower case, defaults to `false`
  strict: true,     // strip special characters except replacement, defaults to `false`
  locale: 'cs'       // language code of the locale to use
};
const pkg = require('./package.json');
const $ = gulpLoadPlugins();
const version = pkg.version;

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

  },
  tmp: {
    folder: 'tmp/',
    data: {
      folder: 'tmp/data/',
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
    pretty: false
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
          babelHelpers: 'inline'
        }),
        commonjs(),
      ],
    },
    output: {
      file: 'dist/assets/js/app.build.js',
      format: 'iife',
      name: 'mdh',
      sourcemap: true,
    },
  },
  // SASS
  sass: {
    errLogToConsole: true,
    includePaths: ['node_modules'],
    outputStyle: 'expanded',
  },
};

const appConfigJson = JSON.parse(fs.readFileSync('./app.config.json'));

config.pug.locals = {
  makeCzechDateFromYMD, makeCzechDateTimeFromYMDT,
};


// ==========================================
// 4. TASKS
// ==========================================

// GENERATING CONTENT AND IMAGES
const mergeMapJson = (done) => {

  gulp.src('./temp/data-maps/**/*.json')
  .pipe($.mergeJson({
    fileName: 'data_maps_merged.json',
  }))
  .pipe(gulp.dest('./temp/'))
  .on("end", () => {

    const mergedMapsRawData = fs.readFileSync(`./temp/data_maps_merged.json`);
    const mergedMapsJsonData = JSON.parse(mergedMapsRawData);

    let transformedJson = {
      maps: Object.assign({}, mergedMapsJsonData)
    };

    transformedJson = JSON.stringify(transformedJson);

    // write the json structure to the file based on the sluggified map name
    fs.writeFileSync(`./temp/data_maps_merged.json`, transformedJson, (err) => {
      if (!err) {
        done();
      } else {
        console.error(err);
      }
    });

    done();


  });

};


const prepareObjectJsonWithImages = async (done) => {

  const subfolderWithImagesName = 'images';
  const allowedImageExtensions = ['jpg', 'jpeg', 'png'];
  const generateThumbnailImages = true;

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

  gulp.src('./data-maps/**/data.geojson')
  .pipe(mapStream(async (file, done) => {

    let filename = path.basename(file.path, path.extname(file.path)); // get the name of the file
    const parentFolderName = path.basename(path.dirname(file.path));

    filename = parentFolderName;

    const parentFolderPath = path.dirname(file.path);
    const subfolderWithImagesPath = `${parentFolderPath}${path.sep}${subfolderWithImagesName}`;
    const subfolderImages = fs.readdirSync(subfolderWithImagesPath);

    // Process objects of the map
    //////////////////////////////////////////////////////////////////////////////////////////
    const objectsJson = JSON.parse(file.contents.toString());

    const objectsNewFeatures = [];


    const subfolderImagesNormalized = subfolderImages.map(item => latinize(slugify(item.normalize('NFC'), slugifyCustomDefaultSettings)).toLowerCase());

    objectsJson.features.forEach( (mapObject, index, thisArray) => {


      const newMapObjectFeatureItem = mapObject;
      newMapObjectFeatureItem.images = [];

      newMapObjectFeatureItem.properties.slug = latinize(slugify(mapObject.properties.name.normalize('NFC'), slugifyCustomDefaultSettings));

      // if true, it means that the map object has images to display
      // compare it based on the sluggified versions of the object and subfolder names
      const hasObjectFolderWithImagesIndex = subfolderImagesNormalized.indexOf(newMapObjectFeatureItem.properties.slug);

      if ( hasObjectFolderWithImagesIndex > -1 ) {

        const folderName = subfolderImages[hasObjectFolderWithImagesIndex];
        const thisFilePath = `${subfolderWithImagesPath}${path.sep}${folderName}${path.sep}`;

        // get a file list from the folder
        const subfolderImagesFiles = fs.readdirSync(`${subfolderWithImagesPath}${path.sep}${folderName}${path.sep}`);

        // process the images one by one and create object structures
        /// find main image
        /// resize & convert types

        let hasMainPhotoBeenCreated = false;

        subfolderImagesFiles.forEach( async (thisFilename) => {

          thisFilename = thisFilename.normalize('NFKD');

          // get the file extension without a dot
          const thisFileImageExtension = path.extname(thisFilename);
          let thisFileImageExtensionWithoutDot = thisFileImageExtension.split('.');

          if (thisFileImageExtensionWithoutDot.length > 1) {
            thisFileImageExtensionWithoutDot = thisFileImageExtensionWithoutDot[1].toLowerCase();
          }

          // process only if the file  type is allowed
          // (based only on the file extension, not the binary data)
          if (allowedImageExtensions.includes(thisFileImageExtensionWithoutDot)) {

            const thisFilenameOnly = path.basename(thisFilename, thisFileImageExtension);
            const thisFileImagePath = `${thisFilePath}${thisFilename}`;

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

            newMapObjectFeatureItem.images.push(imageObj);

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

              // do image processing only if the largest/main does not exist
              if (!fs.existsSync(`${thisObjectFolderNameForImages}${path.sep}${imageObj.name}`)) {

                console.log(thisFileImagePath);

                // resize, rename original

                const image = sharp(thisFileImagePath);

                const imageWidth = (await image.metadata()).width;


                image.resize({width: appConfigJson.appConfig.images.object.full.width}); // resize even if the image is smaller (upsize)

/*                 if (imageWidth > appConfigJson.appConfig.images.object.full.width) {
                  image.resize({width: appConfigJson.appConfig.images.object.full.width}); // resize
                } */

                await image.toFile(`${thisObjectFolderNameForImages}${path.sep}${imageObj.name}`);

                await image.toBuffer();

                // check if the original image size is larger than the max full width size defined in the app settings
                if (!fs.existsSync(`${thisObjectFolderNameForImages}${path.sep}${imageObj.galleryThumbnail}`)) {

                  // generate, resize, rename gallery thumb
                  image
                  .resize({width: appConfigJson.appConfig.images.object.galleryThumbnail.width}) // resize
                  .toFile(`${thisObjectFolderNameForImages}${path.sep}${imageObj.galleryThumbnail}`); // save

                } else {
                  // :TODO: write a message to console that the image is skipped
                }

                if (!fs.existsSync(`${thisObjectFolderNameForImages}${path.sep}${imageObj.thumbnail}`)) {

                  // generate, resize, rename image thumb
                  return image
                  .resize({width: appConfigJson.appConfig.images.object.thumbnail.width, fit: 'cover'}) // resize
                  .toFile(`${thisObjectFolderNameForImages}${path.sep}${imageObj.thumbnail}`); // save

                }

                image = null;

              }

              // description
              /*if (fs.existsSync(potentialTxtFilePath)) {
                // found txt file
                const textData = fs.readFileSync(potentialTxtFilePath, {encoding:'utf8', flag:'r'});
                imageObj.description = textData;
              }*/

            }

          }


        });

      }

      // clean up object
      if (newMapObjectFeatureItem.gx_media_links) {
        delete newMapObjectFeatureItem.gx_media_links;
      }

      // add newly created feature item to new features array
      objectsNewFeatures.push(newMapObjectFeatureItem);


    });

    objectsJson.features = objectsNewFeatures;

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
    //////////////////////////////////////////////////////////////////////////////////////////

    // merge nastaveni and data json files, create a merged single json
    //////////////////////////////////////////////////////////////////////////////////////////

    const nastaveniRawData = fs.readFileSync(`${parentFolderPath}/nastaveni.json`);
    const nastaveniJson = JSON.parse(nastaveniRawData);

    // create final json structure
    const transformedJson = {
      [filename]: Object.assign({}, objectsJson, nastaveniJson)
    };

    // final cleaning up of the JSON file
    const transformedJsonCleanedUp = getCleanUpJSONFromImgTags(JSON.stringify(transformedJson));

    // write the json structure to the file based on the sluggified map name
    fs.writeFileSync(`./temp/data-maps/${filename}/${filename}.json`, transformedJsonCleanedUp, (err) => {
      if (!err) {
          console.log('done');
      }
    });

    //////////////////////////////////////////////////////////////////////////////////////////

    // copy map profile images to temp folder

    try {
      //await copyFile(`./data-maps/${filename}/${nastaveniJson.mainPhoto}`, `./temp/data-maps/${filename}/${nastaveniJson.mainPhoto}`);
      copyFile(`./data-maps/${filename}/${nastaveniJson.mainPhoto}`, `./temp/data-maps/${filename}/${nastaveniJson.mainPhoto}`);
    } catch {
      console.error('The file could not be copied');
    }

    try {
      // await copyFile(`./data-maps/${filename}/${nastaveniJson.thumbPhoto}`, `./temp/data-maps/${filename}/${nastaveniJson.thumbPhoto}`);
      copyFile(`./data-maps/${filename}/${nastaveniJson.thumbPhoto}`, `./temp/data-maps/${filename}/${nastaveniJson.thumbPhoto}`);

    } catch {
      console.error('The file could not be copied');
    }

    done();


  }));

};

const preparePagesMapDetail = (done) => {

  const data = JSON.parse(fs.readFileSync('./temp/data_maps_merged.json'));

  for (const [key, map] of Object.entries(data.maps)) {

    gulp.src('src/views/mapa/map-detail.pug')
    .pipe(
      $.data(
        (file) => map
      )
    )
    .pipe(
      $.data(() => appConfigJson)
    )
    .pipe($.pug(config.pug))
    .pipe($.rename(`detail.html`))
    .pipe(gulp.dest(`./dist/mapa/${map.slug}/`));

    gulp.src('src/views/mapa/map-index.pug')
    .pipe(
      $.data(
        (file) => map
      )
    )
    .pipe(
      $.data(() => appConfigJson)
    )
    .pipe($.pug(config.pug))
    .pipe($.rename(`index.html`))
    .pipe(gulp.dest(`./dist/mapa/${map.slug}/`));


  }

  done();

};

const prepareObjektDetail = (done) => {

  const data = JSON.parse(fs.readFileSync('./temp/data_maps_merged.json'));

  for (const [key, map] of Object.entries(data.maps)) {

    for (let object of map.features) {

      let mapObjectContainer = {
        object,
        map /* :TODO: inject all variables without map.features for faster build! Also, we do not need map.features here */
      };

      gulp.src('src/views/objekt/page-objekt-detail.pug')
      .pipe(
        $.data(
          (file) => mapObjectContainer
        )
      )
      .pipe(
        $.data(() => appConfigJson)
      )
      .pipe($.pug(config.pug))
      .pipe($.rename(`index.html`))
      .pipe(gulp.dest(`./dist/objekt/${object.properties.slug}/`));

    }

  }

  done();

};

const cleanTempDataFolder = (done) => {
  return del(['temp/data-maps'], done);
};

const copyToDist = (done) => {

  gulp.src(['.htaccess'])
  .pipe(gulp.dest('./dist/'));

  done();

};

const copyTempDataToSrc = (done) => {

  gulp.src(['./temp/data-maps/**/*'])
  .pipe(gulp.dest('./src/data-maps/'));

  done();

};

gulp.task('copyTempDataToSrc', copyTempDataToSrc);


const copySrcDataToDist = (done) => {

  gulp.src(['./src/data-maps/**/*'])
  .pipe(gulp.dest('./dist/assets/data-maps/'));

  done();

};

// CLEAN
gulp.task('clean', (done) => {
  return del(['dist'], done);
});

gulp.task('clean-temp', (done) => {
  return del(['temp'], done);
});

// SERVER
gulp.task('serve', (cb) => {

  if (browserSync.active) {
    return;
  }
  browserSync.init(config.browserSync);

  gulp.watch('src/js/**/*.js').on('change', gulp.series('js', browserSync.reload));
  gulp.watch('src/scss/**/*.scss').on('change', gulp.series('sass', browserSync.reload));
  gulp.watch('src/images/**/*.{jpg,png,svg,gif}', gulp.series('images', browserSync.reload));
  gulp.watch(['src/views/**/*.pug'], gulp.series('pug', 'preparePagesMapDetail', browserSync.reload));

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


// SASS
gulp.task('sass', () => {
  return gulp.src('src/scss/main.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass(config.sass).on('error', $.sass.logError))
    .pipe($.sourcemaps.write(gulp.dest('dist/assets/css')))
    .pipe($.autoprefixer())
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



gulp.task('mergeMapJson', mergeMapJson);
gulp.task('preparePagesMapDetail', preparePagesMapDetail);

gulp.task('prepareObjektDetail', prepareObjektDetail);



gulp.task('injectSvg', () => {

  return gulp.src('dist/*.html')
    .pipe($.embedSvg({
      root: 'dist/'
    }))
    .pipe(gulp.dest('./dist'));

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

  gulp.watch(['data/**/*.json'], gulp.series('pug'));

  cb();
});

// GULP:prepare
gulp.task('prepare-generate-data-images', gulp.series(prepareObjectJsonWithImages));
gulp.task('prepare-first', gulp.series(cleanTempDataFolder, prepareObjectJsonWithImages));
gulp.task('prepare-second', gulp.series(mergeMapJson));

// GULP:build
gulp.task('build', gulp.series('clean', 'preparePagesMapDetail', 'prepareObjektDetail', 'pug', 'sass', 'js',  'images', 'fonts', copyToDist, copySrcDataToDist));

// GULP:default
gulp.task('default', gulp.series('build', 'watch', 'serve'));
