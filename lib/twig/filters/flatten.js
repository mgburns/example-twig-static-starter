/**
 * A Twig.js custom filter for flattening the hierarchical sitemap object.
 *
 * @uses  {{ sitemap|flat }}
 */

/**
 * Convert hierarchical sitemap object into a flat list of pages.
 *
 * @param  {Object} sitemap Sitemap object.
 * @return {Array}      Flattened sitemap.
 */
function flatten ( sitemap ) {
  var pages = [], current, page;

  for ( page in sitemap ) {
    current = sitemap[ page ];

    // All pages have a `path` property. Recurse to extract
    // sub-pages if it's not present.
    if ( ! current.hasOwnProperty( 'path' ) ) {
      current = flatten( current );
    }

    pages = pages.concat( current );
  }

  return pages;
}

module.exports = function ( Twig ) {
  Twig.exports.extendFilter( 'flatten', flatten );
}
