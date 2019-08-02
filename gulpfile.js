const isDevelopment = process.env.NODE_ENV !== 'production';

const config = require('yargs')
  .boolean('optimized')
  .default('optimized', false).argv;

// Load Gulp and friends
const { src, dest, watch, series, parallel } = require('gulp');
const del = require('del');
const path = require('path');
const fm = require('front-matter');
const merge = require('merge');
const browserSync = isDevelopment ? require('browser-sync').create('puppy-server') : null;
const $ = require('gulp-load-plugins')();
const vinylMap = require('vinyl-map');
const upbase = require('ups-mixin-lib');
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const webpackDevMiddleware = require('webpack-dev-middleware');
const helpers = require('./lib/gulp/helpers');

$.util.log('Build Mode: %s', config.optimized ? 'Optimized' : 'Development');

const bundler = webpack(webpackConfig);

// Individual low-level task definitions go here

/**
 * Compile HTML
 *
 * - Parse data from front-matter headers
 * - Compile Twig templates
 * - Minify HTML for optimized builds
 */
const html = function() {
  return helpers.prepareTwigContext().then(context => {
    return new Promise(resolve =>
      src(['src/content/**/*.html'])
        // Convert front matter headers to Twig context, accessible
        // in your templates via the `current_page` variable.
        .pipe(
          $.data(file => {
            const content = fm(String(file.contents));
            file.contents = Buffer.from(content.body);

            let currentPage = { path: `/${path.relative(file.base, file.path)}` };
            currentPage = merge(currentPage, content.attributes);

            context['current_page'] = currentPage;

            return context;
          }),
        )

        // Exclude pages with `exclude: true` from build
        .pipe($.filter(file => file.data.current_page.exclude !== true))

        // Compile Twig templates.
        .pipe(
          $.twig({
            base: 'src/templates',
            extend: helpers.addTwigExtensions,
            errorLogToConsole: false,
          }),
        )

        // Prevent rendering Front Matter headers found files not participating in Twig.
        .pipe(vinylMap(code => fm(code.toString()).body))

        // Minify Javascript assets when the path ends in `.min.js`.
        .pipe(
          $.if(
            file => file.path.indexOf('.js') >= 0 && file.path.indexOf('.min.js') >= 0,
            $.uglify().on('error', $.util.log),
          ),
        )

        // Minify CSS assets when the path ends in `.min.css`.
        .pipe(
          $.if(file => {
            return file.path.indexOf('.css') >= 0 && file.path.indexOf('.min.css') >= 0;
          }, $.cleanCss({ processImport: false })),
        )

        // Minify HTML
        .pipe(
          $.if(
            config.optimized,
            $.if(
              '*.html',
              $.htmlmin({
                removeComments: true,
                collapseWhitespace: true,
                collapseBooleanAttributes: true,
                removeAttributeQuotes: true,
                removeRedundantAttributes: true,
                removeEmptyAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
              }),
            ),
          ),
        )

        // Write to dist
        .pipe(dest('dist'))
        .on('end', resolve),
    );
  });
};

/**
 * Custom Modernizr build depending on feature detections used in our source scripts.
 */
const modernizr = function() {
  return src(['src/static/js/**/*.js', 'src/static/scss/**/*.scss'])
    .pipe(
      $.modernizr({
        options: ['setClasses', 'addTest', 'html5printshiv', 'testProp', 'fnBind'],
      }),
    )
    .pipe($.if(config.optimized, $.uglify()))
    .pipe(dest('dist/static/js'));
};

/**
 * Compile CSS
 *
 * - write sourcemaps
 * - apply Autoprefixer
 * - inject & refresh via BrowserSync
 */
const styles = function() {
  const sass = function() {
    const p = src('src/static/scss/**/*.scss')
      .pipe($.sourcemaps.init())

      // Compile Sass
      .pipe(
        $.sass({
          outputStyle: 'nested',
          includePaths: [upbase.includePaths],
        }).on('error', $.sass.logError),
      )

      // Run CSS through autoprefixer
      .pipe($.autoprefixer('last 10 version'))

      // Minify compiled CSS
      .pipe($.if(config.optimized, $.cleanCss({ processImport: false })))

      // Write sourcemaps
      .pipe($.sourcemaps.write('.'))

      // Write development assets
      .pipe(dest('dist/static/css'));

    if (isDevelopment) {
      p
        // Stream generated files to BrowserSync for injection
        // @see http://www.browsersync.io/docs/gulp/#gulp-sass-css
        .pipe(browserSync.stream());
    }
    return p;
  };

  return sass();
};

/**
 * Pipe static image assets to build directory
 */
const images = function() {
  return src('src/static/img/**/*').pipe(dest('dist/static/img'));
};

/**
 * Pipe static font assets to build directory
 */
const fonts = function() {
  return src('src/static/fonts/**/*').pipe(dest('dist/static/fonts'));
};

/**
 * Bundles scripts with Webpack
 */
const scripts = function() {
  return new Promise((resolve, reject) => {
    bundler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        // eslint-disable-next-line
        console.log(
          stats.toString({
            chunks: false,
            colors: true,
          }),
        );
        resolve();
      }
    });
  });
};

/**
 * Clean build directory
 */
const clean = function() {
  return del(['dist']);
};

/**
 * Build task.
 */
const build = series(clean, modernizr, parallel(images, fonts, scripts, styles), html);

exports.build = build;
exports.default = build;

if (isDevelopment) {
  /**
   * Serve build directory locally (development only).
   */
  const serve = function() {
    browserSync.init({
      logPrefix: 'Puppy',
      notify: false,
      reloadDelay: 500,
      open: false,
      server: {
        baseDir: 'dist',
      },
      middleware: [
        webpackDevMiddleware(bundler, {
          writeToDisk: true,
          stats: 'minimal',
        }),
      ],
      plugins: ['bs-fullscreen-message'],
    });

    // Reload browser after Webpack compilation.
    bundler.hooks.done.tap('puppy-serve', stats => {
      if (stats.hasErrors() || stats.hasWarnings()) {
        browserSync.sockets.emit('fullscreen:message', {
          title: 'Webpack Error',
          body: stats.toString(),
          timeout: 100000,
        });
        return;
      }
      browserSync.reload();
    });

    // Recompile templates if any content changes.
    watch(
      ['src/content/**/*.html', 'src/templates/**/*.twig', 'data/**/*.json', 'markdown/**/*.md'],
      series(html, browserSync.reload),
    );

    // Trigger styles task when Sass files change. Note that browser reloading
    // is handled directly in the `sass` task with `browserSync.stream()`
    watch('src/static/scss/**/*.scss', styles);

    // Move static images and fonts to the `dist` directory and reload when source
    // files change
    watch('src/static/img/**/*', series(images, browserSync.reload));
    watch('src/static/fonts/**/*', series(fonts, browserSync.reload));
  };

  const buildAndServe = series(build, serve);

  exports.serve = serve;
  exports.default = buildAndServe;
}
