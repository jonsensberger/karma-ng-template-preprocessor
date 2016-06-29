var util = require('util'),
  parse5 = require('parse5'),
  templateScriptFile = '(function(module) {\n' +
    'try {\n' +
    "  module = angular.module('%s');\n" +
    '} catch (e) {\n' +
    "  module = angular.module('%s', []);\n" +
    '}\n' +
    "module.run(['$templateCache', function($templateCache) {\n" +
    "  $templateCache.put('%s',\n    '%s');\n" +
    '}]);\n' +
    '})();\n',
  escapeContent = function (content) {
    return content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, "").replace(/\r/g, "").replace(/\n/g, "").trim().substring(content.indexOf('<'));
  },
  getAttrObject = function (attrs) {
    var attrObject = {};
    attrs.forEach(attr => {
      attrObject[attr.name] = attr.value;
    });
    return attrObject;
  }
  
var templateScriptToTemplateCachePreprocessor = function (logger, basePath, config) {
  config = typeof config === 'object' ? config : {}
  var log = logger.create('preprocessor.cshtml2js')
  var storedTemplateCache = {};

  return function (content, file, done) {
    log.debug('Processing "%s".', file.originalPath)
    var templateScript = [];
    const moduleName = config.moduleName || "templates";
    const document = parse5.parseFragment(escapeContent(content));
    document.childNodes.forEach(child => {
      if (child.nodeName != 'script') return;
      let attrObject = getAttrObject(child.attrs);
      let templateName = attrObject.id;
      if (attrObject.type != 'text/ng-template' || !templateName || templateName in storedTemplateCache) return;
      storedTemplateCache[templateName] = true;
      child.childNodes.forEach(f => {
        templateScript.push(util.format(templateScriptFile, moduleName, moduleName, templateName, f.value));
      })
    });

    var testFileLocation = '/cshtml2js' + file.path.substring(file.path.indexOf('/'));
    if (!/\.js$/.test(testFileLocation)) {
      file.path = testFileLocation + '.js'
    }
    done(templateScript.length < 1 ? ' ' : templateScript.join(''))
  }
}

templateScriptToTemplateCachePreprocessor.$inject = ['logger', 'config.basePath', 'config.ngTemplatePreprocessor']

module.exports = templateScriptToTemplateCachePreprocessor
