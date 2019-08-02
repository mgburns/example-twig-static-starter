/**
 * A Showdown extension to supplement Markdown support with custom els, like GH-flavored commonalities.
 */

(function () {
	'use strict';

	var showups = function () {

		// Extension to add support for `---` horizontal rules
		var altHorizontalRule = {
			type: 'lang',
			regex: /^-{3}\s*$/gm,
			replace: function (match, prefix, content) {
				return '<hr/>';
			}
		};

		return [ altHorizontalRule ];
	};

	// Client-side export
	if (typeof window !== 'undefined' && window.showdown && window.showdown.extensions) {
		window.showdown.extensions.showups = showups;
	}
	// Server-side export
	if (typeof module !== 'undefined') {
		module.exports = showups;
	}

}());
