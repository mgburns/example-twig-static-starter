[Markdown](https://daringfireball.net/projects/markdown/syntax) is a way to style text on the web. You control the display of the document; formatting words as bold or italic, adding images, and creating lists are just a few of the things we can do with Markdown. Mostly, Markdown is just regular text with a few non-alphabetic characters thrown in, like `#` or `*`.

Here's a quick reference with the basics:

## Styling
---

`*Italics*` or `_Italic_`

*Italics*, _Italic_

`**Bold**` or `__Bold__`

**Bold**, __Bold__

`~~Strikethrough~~`

~~Strikethrough~~

## Headings
---

`# Heading 1`

# Heading 1

`## Heading 2`

## Heading 2

`### Heading 3`

### Heading 3

_...and so on...__


## Links
---

`[Upstatement](https://upstatement.com)`

[Upstatement!](http://upstatement.com)

`[Upstatement.com][1]` ... `[1]: https://upstatement.com`

[Upstatement!][some-key-1]

[some-key-1]: https://upstatement.com


## Images
---

`![Image](http://placehold.it/100x100)`

![Image](http://placehold.it/100x100)

`![Upstatement.com][1]` ... `[1]: http://placehold.it/100x100`

![Image][some-key-2]

[some-key-2]: http://placehold.it/100x100

_and with dimensions (width x height)..._

`![Image](http://placehold.it/100x100 =50x50)`

![Image](http://placehold.it/100x100 =50x50)

`![Image](http://placehold.it/100x* =50x*)`

![Image](http://placehold.it/100x100 =50x*)

`![Image](http://placehold.it/100x100 =10%x30em)`

![Image](http://placehold.it/100x100 =10%x30em)

_and with `srcset` rules (@suffix?descriptor)..._

`![Image](http://placehold.it/100x100 @100x100)`

![Image](http://placehold.it/100x100 @100x100)

`![Image](http://placehold.it/100x100 @200x200?2x)`

![Image](http://placehold.it/100x100 @200x200?2x)

`![Image](http://placehold.it/100x100 @small?100w)`

![Image](http://placehold.it/100x100 @small?100w)

`![Image](http://placehold.it/100x100 @retina?2x)`

![Image](http://placehold.it/100x100 @retina?2x)


## Paragraphs
---

_To create paragraphs, just add a blank line:_

```
Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Ut enim ad minim veniam, quis nostrud exercitation ullamco.
```

Lorem ipsum dolor sit amet, consectetur adipiscing elit.

Ut enim ad minim veniam, quis nostrud exercitation ullamco.


`> Blockquote`

> Blockquote


## Lists

```
* Item 1
* Item 2
```

* Item 1
* Item 2

```
- Item 1
- Item 2
```

- Item 1
- Item 2

```
1. Item 1
2. Item 2
```

1. Item 1
2. Item 2


## Tables (?!)
---

```
| h1    |    h2   |      h3 |
|:------|:-------:|--------:|
| 100   | [a][X]  | ![b][Y] |
| *foo* | **bar** | ~~baz~~ |

[X]: https://upstatement.com
[Y]: http://placehold.it/10x10
```

| h1    |    h2   |      h3 |
|:------|:-------:|--------:|
| 100   | [a][X]  | ![b][Y] |
| *foo* | **bar** | ~~baz~~ |

[X]: https://upstatement.com
[Y]: http://placehold.it/10x10

## Other elements
---

### Horizontal rules, on a new line:
`---` or `***`
---
***

### Inline code, surround with a pair of single backticks, like:
```
`Inline code` with backticks
```
`Inline code` with backticks

### Code block, surround with a pair of 3 backticks (each pair on its own line) to render:
```
# Do the thing
var e = Math.sqrt(m * c);
```

### Tasklists
```
- [x] This task is done
- [ ] This is still pending
```
- [x] This task is done
- [ ] This is still pending

