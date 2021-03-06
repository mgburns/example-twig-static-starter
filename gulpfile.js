// Load Gulp and friends
const { src, dest, watch, series } = require('gulp');
const del = require('del');
const path = require('path');
const fm = require('front-matter');
const merge = require('merge');
const browserSync = require('browser-sync').create();
const $ = require('gulp-load-plugins')();
const webpack = require('webpack');
const webpackConfig = require('./webpack.config');
const webpackDevMiddleware = require('webpack-dev-middleware');
const helpers = require('./lib/gulp/helpers');

const isProduction = process.env.NODE_ENV === 'production';
const bundler = webpack(webpackConfig);

$.util.log('Build Mode: %s', isProduction ? 'Production' : 'Development');

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

        // Minify HTML
        .pipe(
          $.if(
            isProduction,
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
 * Copy public assets to build directory
 */
const publicFiles = function() {
  return src('public/**/*').pipe(dest('dist'));
};

/**
 * Bundle scripts and styles with Webpack.
 */
const bundle = function() {
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
 * Serve build directory locally (development only).
 */
const serve = function() {
  browserSync.init({
    notify: false,
    reloadDelay: 500,
    open: false,
    server: {
      baseDir: 'dist',
    },
    middleware: [
      webpackDevMiddleware(bundler, {
        stats: 'minimal',
        writeToDisk: true,
      }),
    ],
    plugins: ['bs-fullscreen-message'],
  });

  // Reload browser after Webpack compilation.
  bundler.hooks.done.tap('serve', stats => {
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

  // Trigger static task when files in the public directory are changed.
  watch('public/**/*', series(publicFiles, browserSync.reload));
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
const build = series(clean, publicFiles, bundle, html);

module.exports = {
  build,
  serve,
  default: series(build, serve),
};
