const faker = require('faker');
const Author = require('./author');

function Post() {
  return {
    title: faker.company.catchPhrase(),
    content: faker.lorem.paragraphs(10),
    authors: [new Author(), new Author()],
  };
}

module.exports = Post;
