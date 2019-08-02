const fm = require('front-matter');
const gulp = require('gulp');
const gulpSort = require('gulp-sort');
const merge = require('merge');
const path = require('path');

/**
 * Prepare context object for Twig templates.
 *
 * @param  {object} context Initial context object. Optional.
 * @return {Promise}        Promise instance resolving to a populated context object.
 */
exports.prepareTwigContext = function(initialContext) {
  initialContext = initialContext || {};
  return loadTemplateData(initialContext).then(loadSitemap);
};

/**
 * Add custom Twig.js extensions (e.g. tags, filters, and functions).
 *
 * This function iterates over modules in `lib/twig/{filters,functions,tags}/*`, each of which should
 * export a function that extends the Twig object.
 *
 * @see  https://github.com/twigjs/twig.js/wiki/Extending-twig.js
 * @see  https://github.com/twigjs/twig.js/wiki/Extending-twig.js-With-Custom-Tags
 *
 * @param  {Twig}   Twig Internal Twig object for extension.
 */
exports.addTwigExtensions = function(Twig) {
  const twigExtensions = require(path.resolve('lib/twig'));

  ['filters', 'functions', 'tags'].forEach(function(type) {
    for (const name in twigExtensions[type]) {
      twigExtensions[type][name].call(null, Twig);
    }
  });
};

/**
 * Load template data from the `data` directory into the Twig context object.
 *
 * @param  {object} context Initial context object.
 * @return {Promise}        Promise instance resolving to a context object with template data.
 */
function loadTemplateData(context) {
  context['data'] = {};

  return new Promise(function(fulfill, reject) {
    gulp
      .src('data/**/*.json')
      .pipe(gulpSort())
      .on('data', function(file) {
        const fileObj = {};
        const stem = path.basename(file.path, path.extname(file.path));
        fileObj[stem] = loadFileData(file);

        context['data'] = merge.recursive(context['data'], pathObj(file.relative, fileObj));
      })
      .on('error', function(err) {
        reject(err);
      })
      .on('end', function() {
        fulfill(context);
      });
  });
}

/**
 * Load sitemap data into Twig context object.
 *
 * @param  {object} context Initial context object.
 * @return {Promise}        Promise instance resolving to a context object with template data.
 */
function loadSitemap(context) {
  context['sitemap'] = {};

  return new Promise(function(fulfill, reject) {
    gulp
      .src('src/content/**/*.html')
      .pipe(gulpSort())
      .on('data', function(file) {
        const page = fm(String(file.contents)).attributes;
        page.path = `/${file.relative}`;

        const fileObj = {};
        const stem = path.basename(file.path, path.extname(file.path));
        fileObj[stem] = page;

        context['sitemap'] = merge.recursive(context['sitemap'], pathObj(file.relative, fileObj));
      })
      .on('error', function(err) {
        reject(err);
      })
      .on('end', function() {
        fulfill(context);
      });
  });
}

/**
 * Convert a directory path and object into a nested object.
 *
 * @param  {String} objPath Path to convert to nested object.
 * @param  {object} obj     Object to place at end of path.
 * @return {object}         Nested object, with a property for each path component.
 */
function pathObj(objPath, obj) {
  // Ensure object path has at least one parent directory.
  const dirs = path.dirname(objPath);
  if ('.' === dirs) {
    return obj;
  }

  // Convert path components into nested object properties.
  return dirs.split(path.sep).reduceRight(function(prev, curr) {
    const next = {};
    next[curr] = prev;
    return next;
  }, obj);
}

/**
 * Parse data from file.
 *
 * @param  {File}   file Vinyl File object.
 * @return {object}      Parsed data object.
 */
function loadFileData(file) {
  let contents = String(file.contents);

  if ('.json' === path.extname(file.path)) {
    contents = JSON.parse(contents);
  }

  return contents;
}
