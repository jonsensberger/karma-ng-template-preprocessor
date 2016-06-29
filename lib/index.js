// PUBLISH DI MODULE

module.exports = {
  'preprocessor:ng-template': ['factory', require('./templateScriptToTemplateCache')]
}
