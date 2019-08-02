const obj = {
  name: 'example module',
  announce() {
    console.log(`Hello from ${this.name}`);
  },
};

export default obj;
