const faker = require('faker');

function Author() {
  return {
    author: faker.name.findName(),
    avatar: faker.image.avatar(),
  };
}

module.exports = Author;
