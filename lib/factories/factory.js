const jsonfile = require('jsonfile');
const pluralize = require('pluralize');

/**
 * Factory Constructor - used to build data model objs and write to file
 *
 * @return {Object}
 */
const Factory = function() {
  /**
   * creates data objects with genSingle or genMany
   *
   * @param {Function} model - model constructor
   * @param {Number} num - quantity of models to create
   * @return {Function} - genSingle if num <= 1 or falsy, genMany if num > 1
   */
  function generate(model, num) {
    return !num || num <= 1 ? genSingle(model) : genMany(model, num);
  }

  /**
   * creates a single data object
   *
   * @param {Function} model - model constructor
   * @return {Object}
   */
  function genSingle(model) {
    let obj = {};

    if (model) {
      obj = new model();

      // set modelName, used later for setting filename
      try {
        obj.modelName = getName(model, false);
      } catch (e) {
        console.error(e);
        return;
      }
    }

    return obj;
  }

  /**
   * creates array of data objs
   *
   * @param {Function} model - model constructor
   * @param {Number} num - qty of models to create
   * @return {Array}
   */
  function genMany(model, num) {
    const objs = [];

    // set modelName used later for setting filename
    try {
      objs.modelName = getName(model, true);
    } catch (e) {
      console.error(e);
      return;
    }

    if (!!model && typeof model === 'function') {
      for (let i = 0; i < num; i++) {
        objs.push(new model());
      }
    }

    return objs;
  }

  /**
   * writes data json files
   *
   * @param {Array|Object} data
   * @param {String} filename - optional filename
   * @return {Promise}
   */
  function write(data, filename) {
    let file;
    let msg;

    if (data && data.modelName) {
      return new Promise(function(resolve, reject) {
        file = getFilename(data, filename);

        return jsonfile.writeFile(file, data, { spaces: 2 }, function(err) {
          if (err) {
            console.error(err);
            reject(err);
          } else {
            const msg = `Added: ${file}.\n`;
            resolve(msg);
          }
        });
      });
    } else {
      msg = `Could not write file. Data is not valid data object. modelName: ${data.modelName}`;
      throw msg;
    }
  }

  /**
   * creates filename for json file
   * if filename is falsy, formats filname based on data.modelName
   *
   * @param {Array|Object} data
   * @param {String} filename
   * @return {String}
   */
  function getFilename(data, filename) {
    return filename ? `data/${filename}.json` : `data/${data.modelName}.json`;
  }

  /**
   * creates modelName from constructor.name
   *
   * @param {Function} model - constructor
   * @param {Boolean} isMany
   * @return {String}
   */
  function getName(model, isMany) {
    if (!model.name) {
      throw 'model must have a name: ex. var post = function() {}';
    }
    // pluralize if isMany is truthy
    return isMany ? pluralize(model.name.toLowerCase()) : model.name.toLowerCase();
  }

  // Public methods
  return {
    generate: generate,
    write: write,
  };
};

module.exports = new Factory();
