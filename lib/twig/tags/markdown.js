/**
 * A Twig.js custom tag for Markdown content inclusion.
 *
 * @use {% markdown 'path/relative/to/markdown/dir/markdown-file.md' %}
 *
 * e.g, Given ~/markdown/bios/sarah.md: {% markdown 'bios/sarah.md' %}
 *
 */

var fs        = require('fs');
var path      = require('path');
var helpers   = require('../../gulp/helpers');
var fm        = require('front-matter');

var showdown  = require('showdown'),
    showups   = require('../../showdown/ext/showups'),
    srcset    = require('../../showdown/listeners/images-srcset');
var converter = new showdown.Converter({
    extensions: [ showups ],
    noHeaderId: true,
    omitExtraWLInCodeBlocks: true,
    parseImgDimensions: true,
    strikethrough: true,
    tables: true,
    tablesHeaderId: false,
    ghCodeBlocks: true,
    tasklists: true,
    smoothLivePreview: true
  });

// register images-srcset listeners
srcset(converter);

var tag = function(Twig) {
  Twig.exports.extendTag({

    type: "markdown",
    regex: /^markdown\s+((['"]{1}).+\.md\2)$/,
    next: [],
    open: true,

    // Runs on matched tokens when the template is loaded (once per template)
    compile: function (token) {
      var pathTo = token.match[1];

      // Compile the expression. (turns the string into tokens)
      token.stack = Twig.expression.compile.apply(this, [{
        type:  Twig.expression.type.string,
        value: pathTo
      }]).stack;

      delete token.match;

      return token;
    },

    // Runs when the template is rendered
    parse: function (token, context, chain) {
      // Parse the tokens into a value with the render context
      var pathTo = Twig.expression.parse.apply(this, [token.stack, context]),
      // Gather markdown and remove any Frontmatter header
          fmo = fm(fs.readFileSync(path.resolve('markdown', pathTo), 'utf8'));

      var output = converter.makeHtml( fmo.body );

      return {
          chain: false,
          output: output
      };
    }
  });
};

module.exports = tag;
