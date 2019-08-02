Enabling `Model Factories with faker.js` allows you to use [faker.js](https://github.com/Marak/faker.js) to generate data.json files for use in your templates and on the front end. This saves you the trouble of writing lots of json and managing fake content and images. These factories are only invoked by a terminal command, not a gulp task, so you can track and edit them.

### Define Model Factories

You can create custom models to generate fake content with faker.js. Your models must go into the `/models` folder The constructor must return an object with the properties for the model, and the module must export the constructor.

```
var faker = require('faker');

// constructor with unique name
function Person() {
  return {
    name: faker.person.findName()
  }
}

module.exports = Person;
```
Example models are in `/models`.

__Let faker.js reference fake images for you with [faker.image](https://github.com/Marak/faker.js/wiki/Image).__

### Generate Data JSON

To generate the data json you'll need to run a terminal command. Here are the general forms:

```
// generate single model
npm run generate <modelname>
// ex. npm run generate person

// generate multple models
npm run generate <modelname> <number>
// ex. npm run generate person 1000

// custom filename
npm run generate <modelname> <number> <filename>
// ex. npm run generate person 10 people
```

__`npm run g` is a shortcut!__

### Faker Docs Resources
* [faker.js Docs](https://github.com/Marak/faker.js/wiki)
* [faker.js Repo](https://github.com/Marak/faker.js)
