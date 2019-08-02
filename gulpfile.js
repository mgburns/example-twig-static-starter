const isDevelopment = process.env.NODE_ENV !== 'production';

const config = require('yargs')
  .boolean('optimized')
  .default('optimized', false)
  .argv;

// Load Gulp and friends
const gulp        = require('gulp');
const del         = require('del');
const path        = require('path');
const fm          = require('front-matter');
const merge       = require('merge');
const runSequence = require('run-sequence');
const browserSync = isDevelopment ? require('browser-sync').create('puppy-server') : null;
const $           = require('gulp-load-plugins')();
const helpers     = require('./lib/gulp/helpers');
const vinylMap    = require('vinyl-map');
const source      = require('vinyl-source-stream');
const buffer      = require('vinyl-buffer');
const browserify  = require('browserify');
const babelify    = require('babelify');
const upbase = require('ups-mixin-lib');

$.util.log('Build Mode: %s', config.optimized ? 'Optimized' : 'Development');

// Individual low-level task definitions go here

/**
 * Compile HTML
 *
 * - Parse data from front-matter headers
 * - Compile Twig templates
 * - Minify HTML for optimized builds
 */
gulp.task('puppy-html', ['puppy-styles', 'puppy-scripts', 'puppy-bundle'], cb => {

  helpers.prepareTwigContext()
    .then(context => {
      gulp.src(['src/content/**/*.html'])
        // Convert front matter headers to Twig context, accessible
        // in your templates via the `current_page` variable.
        .pipe($.data(file => {
          const content = fm(String(file.contents));
          file.contents = new Buffer(content.body);

          let currentPage = { path: `/${path.relative(file.base, file.path)}` };
          currentPage = merge(currentPage, content.attributes);

          context['current_page'] = currentPage;

          return context;
        }))

        // Exclude pages with `exclude: true` from build
        .pipe($.filter(file => file.data.current_page.exclude !== true))

        // Compile Twig templates.
        .pipe($.twig({
          base: 'src/templates',
          extend: helpers.addTwigExtensions,
          errorLogToConsole: false,
        }))

        // Prevent rendering Frontmatter headers found files not participating in Twig.
        .pipe(vinylMap((code, filename) => fm(code.toString()).body ))

        // Minify Javascript assets when the path ends in `.min.js`.
        .pipe($.if(file => {
          return ((file.path.indexOf('.js') >= 0) && (file.path.indexOf('.min.js') >= 0));
        }, $.uglify().on('error', $.util.log)))

        // Minify CSS assets when the path ends in `.min.css`.
        .pipe($.if(file => {
          return ((file.path.indexOf('.css') >= 0) && (file.path.indexOf('.min.css') >= 0));
        }, $.cleanCss({ processImport: false })))

        // Minify HTML
        .pipe($.if(config.optimized, $.if('*.html', $.htmlmin({
          removeComments: true,
          collapseWhitespace: true,
          collapseBooleanAttributes: true,
          removeAttributeQuotes: true,
          removeRedundantAttributes: true,
          removeEmptyAttributes: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
        }))))

        // Write to dist
        .pipe(gulp.dest('dist'))

        // Notify of task completion. Required since we're using async code (promises)
        // to populated template context.
        .on('end', cb);
    });
});

/**
 * Compile CSS
 *
 * - write sourcemaps
 * - apply Autoprefixer
 * - inject & refresh via BrowserSync
 */
gulp.task('puppy-styles', ['puppy-modernizr'], () => {
  const p = gulp.src('src/static/scss/**/*.scss')
    .pipe($.sourcemaps.init())

    // Compile Sass
    .pipe(
      $.sass({
        outputStyle: 'nested',
        includePaths: [upbase.includePaths],
      })
        .on('error', $.sass.logError)
    )

    // Run CSS through autoprefixer
    .pipe($.autoprefixer('last 10 version'))

    // Minify compiled CSS
    .pipe($.if(config.optimized, $.cleanCss({ processImport: false })))

    // Write sourcemaps
    .pipe($.sourcemaps.write('.'))

    // Write development assets
    .pipe(gulp.dest('dist/static/css'));

  if (isDevelopment) {
    return p
      // Stream generated files to BrowserSync for injection
      // @see http://www.browsersync.io/docs/gulp/#gulp-sass-css
      .pipe(browserSync.stream());
  }

  return p;
});

/**
 * Pipe static image assets to build directory
 */
gulp.task('puppy-images', () => {
  return gulp.src('src/static/img/**/*')
    .pipe(gulp.dest('dist/static/img'));
});

/**
 * Pipe static font assets to build directory
 */
gulp.task('puppy-fonts', () => {
  return gulp.src('src/static/fonts/**/*')
    .pipe(gulp.dest('dist/static/fonts'));
});

/**
 * Bundles scripts with Browserify and Babel
 */
gulp.task('puppy-bundle', () => {
  const babel = babelify.configure({
    sourceMaps: true,
    presets: ['env'],
  });

  const browse = browserify({
    entries: './src/static/js/main.js',
    debug: true,
    transform: [ babel ],
  });

  return browse.bundle()
    .on('error', err => {
      $.util.log(err.message);
      this.emit('end');
    })
    .pipe(source('main.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({ loadMaps: true }))
    .pipe($.if(config.optimized, $.uglify()))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest('dist/static/js/'));
});

/**
 * Pipe static Javascript assets to build directory
 */
gulp.task('puppy-scripts', ['puppy-modernizr'], () => {
  return gulp.src('src/static/js/**/*')
    .pipe(gulp.dest('dist/static/js'));
});

/**
 * Custom Modernizr build depending on feature detections used in our source scripts.
 */
gulp.task('puppy-modernizr', () => {
  return gulp.src([
    'src/static/js/**/*.js',
    'src/static/scss/**/*.scss',
  ])
    .pipe($.modernizr({
      options: [
        'setClasses',
        'addTest',
        'html5printshiv',
        'testProp',
        'fnBind',
      ],
    }))
    .pipe($.if(config.optimized, $.uglify()))
    .pipe(gulp.dest('dist/static/js'));
});


/**
 * Clean build directory
 */
gulp.task('puppy-clean', () => del(['dist']));

if (isDevelopment) {
  /**
   * Serve build directory locally
   */
  gulp.task('puppy-serve', ['puppy-build'], () => {
    browserSync.init({
      logPrefix: 'Puppy',
      notify: false,
      reloadDelay: 500,
      open: false,
      server: {
        baseDir: 'dist',
      },
    });

    // Recompile templates if any HTML, Twig or scripts change
    gulp.watch([
      'src/content/**/*.html',
      'src/templates/**/*.twig',
      'src/static/js/**/*',
      'data/**/*.json',
      'markdown/**/*.md',
    ], ['puppy-html', browserSync.reload]);

    // Trigger styles task when Sass files change. Note that browser reloading
    // is handled directly in the `sass` task with `browserSync.stream()`
    gulp.watch('src/static/scss/**/*.scss', ['puppy-styles']);

    // Move static images and fonts to the `dist` directory and reload when source
    // files change
    gulp.watch('src/static/img/**/*', ['puppy-images', browserSync.reload]);
    gulp.watch('src/static/fonts/**/*', ['puppy-fonts', browserSync.reload]);
  });

}

module.exports = gulp;

// Puppy build process, required before `puppy-serve`

gulp.task('puppy-build', cb => {
  return runSequence('puppy-clean', ['puppy-images', 'puppy-fonts', 'puppy-html'], cb);
});

gulp.task('default', ['puppy-serve']);
