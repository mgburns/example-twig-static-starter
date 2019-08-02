const path = require('path');
const registry = require('require-all')({
  dirname: path.resolve(__dirname, '../../models'),
  recursive: true,
});
const factory = require('./factory');
const args = process.argv;

/**
 * lookupModel - looks up the model in the register
 *
 * @param {String} name - model name to lookup
 * @return {Function|null} - model factory or null of no model factory exists
 */
function lookupModel(name) {
  return name && registry[name] ? registry[name] : null;
}

/**
 * getNum - parses the number of models to generate from process.argv
 *
 * @param {Array} args - from process.argv
 * @return {Number}
 * @throws Will throw error if second argument isn't a number
 */
function getNum(args) {
  let msg;
  let num = args[3];

  if (!num) {
    num = 1;
  } else {
    num = parseInt(num);
  }

  if (isNaN(num)) {
    msg = `Second parameter must be a number. You passed in ${args[3]}`;
    throw msg;
  }

  return num;
}

/**
 * getModelName - parses the modelname from process.argv
 *
 * @param {Array} args - from process.argv
 * @return {String} name of model
 * @throws Will throw error if model file doesn't exist, no name passed in to second arg, or arg in number
 */
function getModelName(args) {
  let name = args[2];
  let msg;

  if (!name || parseInt(name)) {
    msg = `First parameter must be a valid model name. You passed in ${args[2]}`;
    throw msg;
  } else {
    name = name.toLowerCase();
  }

  if (typeof name !== 'string' || !lookupModel(name)) {
    msg = `${args[2]} is not a valid model name.`;
    throw msg;
  }

  return name;
}

function getFilename(args) {
  let filename;
  let msg;
  const name = args[4];

  if (!name) {
    return false;
  } else if (parseInt(name) || typeof name !== 'string') {
    msg = `Third parameter must be a valid file name. You passed in ${args[4]}`;
    throw msg;
  } else {
    filename = name.toLowerCase();
  }

  return name;
}

/**
 * generateModel - writes json file for a model
 * uses factory to generate model objects and write file
 *
 * @param {Array} args - from process.argv
 * @return {undefined}
 */
function generateModel(args) {
  const modelName = getModelName(args);
  const qty = getNum(args);
  const filename = getFilename(args);

  // generate our models
  const models = factory.generate(lookupModel(modelName), qty);

  // write them to json
  factory
    .write(models, filename)
    .then(function(msg) {
      msg = msg && typeof msg !== 'undefined' ? msg : '';
      msg += `${qty} ${modelName} models created.\n`;
      console.log(msg);
    })
    .catch(function(err) {
      console.log(err);
    });
}

generateModel(args);
