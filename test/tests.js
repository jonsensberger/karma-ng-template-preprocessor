var assert = require('assert'),
    templateScriptToTemplateCache = require('../lib/templateScriptToTemplateCache'),
    stripNewLineNewRow = (htmlContent) => {
        return htmlContent.replace(/\r/g, "").replace(/\n/g, "");
    },
    getTemplateScript = (htmlTag, scriptTag) => {
        var scriptTagNode = scriptTag || 'script';
        return `<${scriptTagNode} type="text/ng-template" id="${htmlTag.id}">${htmlTag.html}</${scriptTagNode}>`
    },
    htmlTag1 = {
        id: 'htmlTag1',
        html: `<th ng-show="isBroadbandApplicable1" class="results-column-usage1"><span> test </span></th>`
    },
    htmlTag2 = {
        id: 'htmlTag2', html: `<th ng-show="isBroadbandApplicable2" class="results-column-usage2"><div>x</div></th>`
    },
    htmlTag3 = {
        id: 'htmlTag3',
        html: `<th><span> test </span></th><th><span>the xx</span></th>`
    },
    htmlTag4 = {
        id: 'htmlTag4',
        html: `<span><span> test </span></span><div><span>the xx</span></div>`
    },
    htmlTag5 = {
        id: 'htmlTag5',
        html: `<span ng-class="{'escape', : x}"></span>`
    },
    htmlTag6 = {
        id: 'htmlTag6',
        html: `<span ng-if="fake && fake2"></span>`
    };


describe('transform template script to templateCache', function () {
    var templateScriptToTemplateCacheFunc;

    beforeEach(function () {
        templateScriptToTemplateCacheFunc = templateScriptToTemplateCache({ create: function () { return { debug: function () { } } }, }, '/test/', {})
    })

    it('Should have the default moduule name', function (done) {
        var content = getTemplateScript(htmlTag1);
        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf(`angular.module('templates')`) != -1, true, 'module name missing')
            done();
        })
    });

    it('Should create 2 template cache scripts', function (done) {
        var content = `${getTemplateScript(htmlTag1)} 
                        ${getTemplateScript(htmlTag2)}`

        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag1.html)) != -1, true)
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag2.html)) != -1, true)
            done();
        })
    });
    
    it('Should only have 1 template cache if two scripts templates have the same id', function (done) {
        var content = `${getTemplateScript(htmlTag1)} 
                        ${getTemplateScript({ id: htmlTag1.id, html: htmlTag2.html })}`

        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag1.html)) != -1, true)
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag2.html)) != -1, false)
            done();
        })
    });
    
    it('Should handle html where there is no parent element', function (done) {
        var content = getTemplateScript(htmlTag3)
        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag3.html)) != -1, true)
            done();
        })
    });
    
    it('Should handle html where there is no parent element and they are of different node types', function (done) {
        var content = getTemplateScript(htmlTag4)
        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf(stripNewLineNewRow(htmlTag4.html)) != -1, true)
            done();
        })
    });
    
    it('Should escape \' and handle script tag in different case', function (done) {
        var content = getTemplateScript(htmlTag5, 'SCRIPT')
        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf("\'") != -1, true)
            done();
        })
    });
    
    it('Should handle invalid xml such as && which can be used in ng-if', function (done) {
        var content = getTemplateScript(htmlTag6)
        templateScriptToTemplateCacheFunc(content, { originalPath: '/test/', path: '' }, function (result) {
            assert.equal(result.indexOf('&&') != -1, true)
            done();
        })
    });
});