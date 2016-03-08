Lighter Javascript Templates
============================

Derived from EJS Embedded Javascript Templates with new expressions for lighter templates

## How-To

### Install
```bash
npm install ljs-template --save
```

### Render
```javascript
var ljs = require('ljs-template');

var out = ljs.render("Hello {{_name_}}", {name: "Max"});

console.log(out);
```

### It displays:
```
Hello Max
```

## Sample

### Template :
```html
var template = `

<h1>Books:</h1>

{#each books as book #}
<h2>{{_book.title_}}</h2>
<ul>
  <li>Authors:
   {#if book.authors #}
    <ul>
    {#each book.authors as author #}
      <li>{{_author_}}</li>
    {/each/}
    </ul>
   {/if/}
  </li>
  <li>Price: {{_book.price_}}
</ul>
{/each/}

`;
```

### Data :
```javascript
var data =
{
  books: [
    {
      title: "Cravings: Recipes for All the Food You Want to Eat",
      authors: ["Chrissy Teigen", "Adeena Sussman"],
      price: "$17.85"
    },
    {
      title: "Pretty Happy: Healthy Ways to Love Your Body",
      authors: ["Kate Hudson"],
      price: "$15.89"
    }
  ]
}
```

### Render :
```javascript
var ljs = require('ljs-template');

var out = ljs.render(template, data);

console.log(out);
```

### It displays:
```html
<h1>Books:</h1>
<h2>Cravings: Recipes for All the Food You Want to Eat</h2>
<ul>
  <li>Authors:
    <ul>
      <li>Chrissy Teigen</li>
      <li>Adeena Sussman</li>
    </ul>
  </li>
  <li>Price: $17.85
</ul>
<h2>Pretty Happy: Healthy Ways to Love Your Body</h2>
<ul>
  <li>Authors:
    <ul>
      <li>Kate Hudson</li>
    </ul>
  </li>
  <li>Price: $15.89
</ul>
```

## Expressions

### Javascript code :
```
{%
  [javascript]
%}
```

### Define variable :
```
{#var [variable] = [javascript] #}
```

### Display variable :
```
{{_[variable]_}}
```

### If conditional :
```
{#if [condition] #}

{/else/}

{/if/}
```

### Loop over Map entries :
```
{#each [map] as [value], [key] #}
{/each/}
```

### Loop over Array values :
```
{#each [array] as [value], [index] #}
{/each/}
```
