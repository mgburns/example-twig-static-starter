# Extending Twig

Twig.js supports [extension](https://github.com/twigjs/twig.js/wiki/Extending-twig.js-With-Custom-Tags) by adding custom filters, functions and tags. This directory holds custom Twig extensions for Puppy projects.

`require`ing this directory gives you an object with `filters`, `functions` and `tags` properties that hold any custom extensions defined in their respective sub-directories.

Each file added to the sub-directory should export a function that takes a single argument -- the `Twig` object to extend -- which it should use to add the custom extension.

For example, a custom `hello` function could be defined as follows:

```js
// ./functions/hello.js

module.exports = function(Twig) {
  Twig.exports.extendFunction('hello', function(name) {
    return 'Hello, ' + name;
  });
};
```

Which could then be called in code as follows:

```twig
{{ hello('Mike') }} // "Hello, Mike"
```

See the [tags/markdown](tags/markdown) and [filters/flatten](filters/flatten) for less contrived examples.
