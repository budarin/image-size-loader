var loaderUtils = require('loader-utils');
var sizeOf = require('image-size');
var fs = require('fs');
var urlre = new RegExp('^(?:[a-z]+:)?//', 'i');

// some lightweight dumb uri join
var urijoin = function(parts) {
  var _parts = [];
  parts.map(function(p) {
    _parts = _parts.concat(
      p.split('/').filter(function(x) {return x;})
    );
  });
  return _parts.join('/');
};

module.exports = function(content) {

  this.cacheable && this.cacheable(true);
  if(!this.emitFile) throw new Error('emitFile is required from module system');
  this.addDependency(this.resourcePath);

  var query = loaderUtils.parseQuery(this.query);
  var filename = "[name].[ext]";

  if ('string' === typeof query.name) {
    filename = query.name;
  }

  var url = loaderUtils.interpolateName(this, filename, {
    context: query.context || this.options.context,
    content: content,
    regExp: query.regExp
  });

  var image = sizeOf(this.resourcePath);
  var publicPath = this.options.output.publicPath;

  image.src = publicPath
    ? (urlre.test(publicPath) ? urijoin(publicPath, url) : path.join(publicPath, url))
    : url

  image.src = this.options.output.publicPath
    ? path.join(this.options.output.publicPath, url)
    : url;

  image.bytes = fs.statSync(this.resourcePath).size;

  this.emitFile(url, content);

  var output = JSON.stringify(image);

  if (query.json) {
    return output;
  }

  // For requires from CSS when used with webpack css-loader,
  // outputting an Object doesn't make sense,
  // So overriding the toString method to output just the URL
  return 'module.exports = ' + output + ';'
    + 'module.exports.toString = function() {'
    + 'return ' + JSON.stringify(image.src) + '}';
};

module.exports.raw = true;
