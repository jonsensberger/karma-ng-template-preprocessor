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
  escapeContent = content => {
    return content.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, "").replace(/\r/g, "").replace(/\n/g, "").trim().substring(content.indexOf('<'));
  },
  getAttrObject = attrs => {
    var attrObject = {};
    attrs.forEach(attr => {
      attrObject[attr.name] = attr.value;
    });
    return attrObject;
  },
  shouldProcessTemplate = (storedTemplateCache, templateName, templateId, file) => {
    if (templateId != 'text/ng-template' || !templateName) return false;
    return !(templateName in storedTemplateCache
      && (storedTemplateCache[templateName].path != file.originalPath || storedTemplateCache[templateName].modified == file.mtime)
    );
  },
  addTemplateToStoredTemplateCache = (storedTemplateCache, templateName, file) => {
    storedTemplateCache[templateName] = {
      path: file.originalPath,
      modified: file.mtime
    }
  }

var templateScriptToTemplateCachePreprocessor = (logger, basePath, config) =>{
  config = typeof config === 'object' ? config : {}
  var log = logger.create('preprocessor.cshtml2js')
  var storedTemplateCache = {};

  return (content, file, done) => {
    log.debug('Processing "%s".', file.originalPath)
    var templateScript = [];
    const moduleName = config.moduleName || "templates";
    const document = parse5.parseFragment(escapeContent(content));
    document.childNodes.forEach(child => {
      if (child.nodeName != 'script') return;
      let attrObject = getAttrObject(child.attrs);
      let templateName = attrObject.id;
      if (!shouldProcessTemplate(storedTemplateCache, templateName, attrObject.type, file)) return;
      addTemplateToStoredTemplateCache(storedTemplateCache, templateName, file);
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
