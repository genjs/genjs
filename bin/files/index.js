var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var ljs = require('ljs-template');
var mkdirp = require('mkdirp');
var U = require('gutil');
var merge = require('merge');

String.prototype.a = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.A = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.U = function () {
    return this.toUpperCase()
}
String.prototype.l = function () {
    return this.toLowerCase()
}
String.prototype.removeUnderscore = function () {
  if(this.indexOf('_') == -1) {
    return this;
  }
  var splitted = this.split('_');
  var str = '';
  for(var i=0; i<splitted.length; i++) {
    if(str === '') {
      str = splitted[i];
    } else {
      str += splitted[i].A();
    }
  }
  return str;
};

function loadData(dir) {
  var data = {};
  var files = fs.readdirSync(dir);
  for(var i=0; i<files.length; i++) {
    var filename = files[i];
    var file = path.join(dir, filename);
    if(fs.statSync(file).isDirectory()) {
      var dataToMerge = loadData(file);
      data[filename] = merge.recursive(data[filename], dataToMerge);
    } else {
      var name = path.basename(filename, path.extname(filename));
      try {
        var dataToMerge = yaml.safeLoad(fs.readFileSync(file, 'utf8')) || {};
        data[name] = merge.recursive(data[name], dataToMerge);
      } catch (e) {
        console.log('Error in YAML file:', file, ' - error:', e);
      }
    }
  }
  return data;
}

function validateData(dir, data) {
  var hasValidationError = false;
  var files = fs.readdirSync(dir);
  for(var i=0; i<files.length; i++) {
    var filename = files[i];
    var file = path.join(dir, filename);
    if(fs.statSync(file).isFile()) {
      var validate = require(path.join(process.cwd(),file));
      try {
        var errors = validate.validate(data);
        if(errors != null && errors instanceof Array && errors.length > 0) {
          hasValidationError = true;
          console.log('****************************');
          console.log('**** Validation errors ****');
          console.log('=>',file,':');
          for(var i=0; i<errors.length; i++) {
            console.log((i+1)+')',errors[i]);
          }
          console.log('****************************');
        }
      } catch(e) {
        console.log('Error during validation - Validate file:',file,' - Error:',e);
        return true;
      }
    }
  }
  return hasValidationError;
}

function loadHelpers(dir) {
  var helpers = {};
  var hasValidationError = false;
  var files = fs.readdirSync(dir);
  for(var i=0; i<files.length; i++) {
    var filename = files[i];
    var file = path.join(dir, filename);
    var helperName = path.basename(filename, path.extname(filename));
    if(fs.statSync(file).isFile()) {
      if(!path.isAbsolute(file)) {
      	file = path.join(process.cwd(), file);
      }
      try {
        if(require.resolve(file)) {
          delete require.cache[require.resolve(file)];
        }
        helpers[helperName] = require(file);
      } catch(e) {
        console.log('** Error ** - Helper "'+file+'":',e);
      }
    }
  }
  return helpers;
}

function generate(data, helpers, indir, outdir) {
  var dirs = fs.readdirSync(indir);
  for(var i=0; i<dirs.length; i++) {
    var dir = path.join(indir, dirs[i]);
    if(fs.statSync(dir).isDirectory()) {
      generateSub(data, helpers, indir, outdir, dirs[i], '');
    }
  }
}

function generateSub(data, helpers, indir, outdir, type, subdir) {
  var files = fs.readdirSync(path.join(indir, type, subdir));
  for(var i=0; i<files.length; i++) {
    var filename = files[i];
    var file = path.join(indir, type, subdir, filename);
    if(fs.statSync(file).isDirectory()) {
      var dir = path.join(subdir, filename);
      generateSub(data, helpers, indir, outdir, type, dir);
    } else {
      var outfile = path.join(outdir, subdir, filename);
      generateFile(data, helpers, file, outfile, type);
    }
  }
  return data;
}

function generateFile(data, helpers, infile, outfile, type) {
  if(outfile.indexOf('[name') != -1) {
    for(var currentName in data[type]) {
      var current = data[type][currentName];
      var currentFile =
        outfile
          .replace(/\[name\]/g, currentName)
          .replace(/\[name_a\]/g, currentName.a())
          .replace(/\[name_A\]/g, currentName.A())
          .replace(/\[name_l\]/g, currentName.l())
          .replace(/\[name_U\]/g, currentName.U());
      var pos;
      while((pos = currentFile.indexOf('[')) != -1) {
        var posEnd = currentFile.indexOf(']', pos);
        var expr = currentFile.substring(pos+1, posEnd);
        var exprSplits = expr.split('_');
        var value = data;
        for(var i=0; i<exprSplits.length && value != null; i++) {
          if(exprSplits[i] != null && exprSplits[i] != '') {
            value = value[exprSplits[i]];
          }
        }
        if(value != null && value != '') {
          value = value.replace(/\./g, path.sep); // does not work for file name
          currentFile = currentFile.substring(0, pos) + value + currentFile.substring(posEnd+1);
        }
      }
      renderFile(infile, currentFile, {
        data: data, current: current, currentName: currentName, H: helpers, U: U});
    }
  } else {
    renderFile(infile, outfile, {data: data, H: helpers, U: U});
  }
}

function renderFile(infile, outfile, context) {
  context.include = include(context);
  try {
    fs.readFile(infile, 'utf8', function(e, templatecontent) {
      if(e) {
        throw e;
      }
      if(templatecontent) {
        var newcontent = render(infile, templatecontent, context);
        fs.readFile(outfile, 'utf8', function(e, currentcontent) {
          if(e || currentcontent != newcontent) {
            mkdirp(path.dirname(outfile), function(e) {
              if(e) {
                throw e;
              }
              fs.writeFileSync(outfile, newcontent, 'utf8');
            })
          }
        });
      }
    });
  } catch (e) {
    console.log('Error in template file:', file, ' - error:', e);
  }
}

function render(infile, content, context) {
  try {
    return ljs.render(minify(content), context);
  } catch(e) {
    try {
      return ljs.render(content, context);
    } catch(e) {
      console.log("-------------------------------------------");
      console.log(' - currentName : ', data.currentName);
      console.log(' - current : ', data.current);
      console.log(' - template : ', infile);
      console.log("-------------------------------------------");
      console.log(' => Error on template : ', infile);
      console.log('');
      console.log('Message : ', e);
    }
  }
}

function include(context) {
  return (function(infile, context2) {
    if(context2) {
      for(var key in context) {
        if(context2[key] === undefined) {
          context2[key] = context[key];
        }
      }
    } else {
      context2 = context;
    }
    try {
      var content = fs.readFileSync(infile, 'utf8');
      return render(infile, content || '', context2);
    } catch(e) {
      console.log('Error: include file:',infile,' - context: ',context2, ' - error: ',e);
    }
  });
}

function getLineEnding(content) {
  return (content.indexOf('\r') != -1)?'\r':'' + (content.indexOf('\n') != -1)?'\n':'';
}

function minify(content) {
  var lineEnding = getLineEnding(content);
  var regexp = "("+lineEnding+"){1,2}(("+lineEnding+")*)[ |\t]*({[%|#|/](?!=).*)";
  return content.replace(new RegExp(regexp, 'g'), "$2$4");
}

console.log('-- START --');

console.log('=> Load data');
var data = loadData('data');

console.log('=> Validate data');
var hasValidationError = validateData('validate', data);
if(hasValidationError) {
  console.log('=> Skip generate phase')
  console.log('-- END --');
  return;
}

console.log('=> Load helpers');
var helpers = loadHelpers('helpers');

console.log('=> Generate');
generate(data, helpers, 'templates', '..');

console.log('-- END --');
