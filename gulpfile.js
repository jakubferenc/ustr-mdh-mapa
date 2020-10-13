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


const path = require('path');

const pkg = require('./package.json');

const $ = gulpLoadPlugins();

const version = pkg.version;

const ftpSettings = require('./ftp.json');
const ftp = require( 'vinyl-ftp' );
const changed = require('gulp-changed');


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
      $.data(() => JSON.parse(fs.readFileSync('./temp/data_merged.json')))
    )
    .pipe(
      $.data(() => JSON.parse(fs.readFileSync('./app.config.json')))
    )
    .pipe($.pug(config.pug))
    .pipe(gulp.dest('dist/'))
    .pipe(browserSync.reload({
      stream: true,
    }));
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

const mergeMapJson = () => {
  return gulp.src('./data-maps/**/*.json')
  .pipe(mapStream((file, done) => {

    const filename = path.basename(file.path, path.extname(file.path));

    const json = JSON.parse(file.contents.toString());
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
      /*.pipe(
        $.data(() => JSON.parse(fs.readFileSync('./data/data_merged.json')))
      )*/
      .pipe($.pug(config.pug))
      .pipe($.rename(`${key}.html`))
      .pipe(gulp.dest(`./dist/`));

  }

  done();

};

gulp.task('mergeJson', gulp.series('clean-temp', mergeJsonFunc, mergeMapJson));

gulp.task('preparePagesMapDetail',  gulp.series(mergeMapJson, preparePagesMapDetail));



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
gulp.task('build', gulp.series('clean', 'mergeJson', 'sass', 'js', 'images', 'fonts', 'pug', 'copyToDist'));

// GULP:default
gulp.task('default', gulp.series('build', 'watch', 'serve'));
