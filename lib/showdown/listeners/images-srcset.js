/**
 * A Showdown extension to support the srcset attribute in images
 *
 * This extension hooks into the native images subParser via two listeners:
 * The first listener detects source rules in the Markdown markup and appends them to the URL for access in the second listener
 * The second listener detects source rules in the URL, converts them into image candidate strings, and adds them to a `srcset` attribute inserted back into the HTML markup
 */

var showdown = require('showdown');

var matchClose = /\s*\/?>/;
var matchExt = /\.\w+$/;
var matchRuleList = /(?:(?:\s@\w+(?:\?\w+)?)+)/;
var matchRuleParts = /^@(\w+)(?:\?(\w+))?$/;
var matchSizes = /@(\d+)x(\d+)/;
var matchSrcAttr = /src=['"][^'"]+['"]/;
var matchHTMLTag = /<img[^>]+src=['"]([\S]+)\|\|((?:@\w+(?:\?\w+)?,?)+)['"][^>]*\/?>/g;
var matchMdTag = /!\[(.*?)]\s?\([ \t]*()<?(\S+?)>?(?: =([*\d]+[A-Za-z%]{0,4})x([*\d]+[A-Za-z%]{0,4}))?[ \t]*(?:(['"])(.*?)\6[ \t]*)?[ \t]*((?:\s@\w+(?:\?\w+)?)+)[ \t]*\)/g;

function srcsetBefore(event, text, converter, options, globals) {
  // append source rules to image URL
  return text.replace(matchMdTag, function(wholeMatch, altText, linkId, url, width, height, m5, title, ruleList) {
    var output, sources;
    sources = ruleList.trim().replace(' ', ',');
    output = wholeMatch.replace(ruleList, '');
    output = output.replace(url, url + '||' + sources);
    return output;
  });
}

function srcsetAfter(event, text, converter, options, globals) {
  // extract sources & add generated srcset attribute
  return text.replace(matchHTMLTag, function(wholeMatch, url, rules) {
    var attribute, extCheck, output, sources, urlParts = {};

    // parse image URL
    var extCheck, urlParts;
    checkExt = url.match(matchExt);
    urlParts.name = url.replace(matchExt, '');
    urlParts.ext = checkExt ? checkExt[0] : '';

    // create srcset attribute
    var sources, attribute;
    sources = rules.split(',').map(ruleICS(urlParts));
    attribute = 'srcset="' + sources.join(',') + '"';

    // modify src & add srcset
    var ouput, srcAttr;
    output = wholeMatch.replace(matchSrcAttr, 'src="' + url + '"');
    output = output.replace(matchClose, ' ' + attribute + ' />');

    return output;
  });
}



function ruleICS(url) {
  return function(rule) {
    // catch suffix and descriptor from rule
    var parts = rule.match(matchRuleParts);
    var suffix = parts[1];
    var descriptor = parts[2];
    // detect implicit descriptor for numeric rule (@100x200 -> 100w)
    if (descriptor === undefined) {
      var sizes = rule.match(matchSizes);
      descriptor = (sizes !== null) ? sizes[1] + 'w' : '';
    }
    // combine parts into image candidate string
    return url.name + '-' + suffix + url.ext + ' ' + descriptor;
  }
}

module.exports = function(converter) {
  converter.listen('images.before', srcsetBefore);
  converter.listen('images.after', srcsetAfter);
}
