var fs = require('fs');
var path = require('path');
var yaml = require('js-yaml');
var ljs = require('ljs-template');
var mkdirp = require('mkdirp');
var U = require('gutil');

String.prototype.a = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.A = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
String.prototype.U = function () {
    return this.charAt(0).toUpperCase()
}
String.prototype.l = function () {
    return this.charAt(0).toLowerCase()
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
      data[filename] = loadData(file);
    } else {
      var name = path.basename(filename, path.extname(filename));
      try {
        data[name] = yaml.safeLoad(fs.readFileSync(file, 'utf8'));
      } catch (e) {
        console.log('Error in YAML file:', file, ' - error:', e);
      }
    }
  }
  return data;
}

function generate(data, indir, outdir) {
  var dirs = fs.readdirSync(indir);
  for(var i=0; i<dirs.length; i++) {
    var dir = path.join(indir, dirs[i]);
    if(fs.statSync(dir).isDirectory()) {
      generateSub(data, indir, outdir, dirs[i], '');
    }
  }
}

function generateSub(data, indir, outdir, type, subdir) {
  var files = fs.readdirSync(path.join(indir, type, subdir));
  for(var i=0; i<files.length; i++) {
    var filename = files[i];
    var file = path.join(indir, type, subdir, filename);
    if(fs.statSync(file).isDirectory()) {
      var dir = path.join(subdir, filename);
      generateSub(data, indir, outdir, type, dir);
    } else {
      var outfile = path.join(outdir, subdir, filename);
      generateFile(data, file, outfile, type);
    }
  }
  return data;
}

function generateFile(data, infile, outfile, type) {
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
      renderFile(infile, currentFile, {
        data: data, current: current, currentName: currentName, H: H, U: U});
    }
  } else {
    renderFile(infile, outfile, {data: data, H: H, U: U});
  }
}

function renderFile(infile, outfile, context) {
  context.include = include(context);
  try {
    console.log('content:',infile);
    fs.readFile(infile, 'utf8', function(e, content) {
      if(e) {
        throw e;
      }
      if(content) {
        var outcontent = render(infile, content, context);
        fs.readFile(outfile, 'utf8', function(e, content) {
          if(e || content != outcontent) {
            mkdirp(path.dirname(outfile), function(e) {
              if(e) {
                throw e;
              }
              fs.writeFileSync(outfile, outcontent, 'utf8', function(e) {
                throw e;
              });
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
    return ljs.render(content, context);
  } catch(e) {
    console.log("-------------------------------------------");
    console.log(' - currentName : ', data.currentName);
    console.log(' - current : ', data.current);
    console.log(' - template : ', infile);
    console.log("-------------------------------------------");
    console.log(' => Error on template : ', infile);
    console.log('');
    console.log('Message : ', e.msg);
    throw e;
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

function loadHelpers(folder) {
  var file = path.join('helpers','H.js');
  if(!path.isAbsolute(file)) {
  	file = path.join(process.cwd(), file);
  }
  try {
    if(require.resolve(file)) {
      delete require.cache[require.resolve(file)];
    }
    return require(file);
  } catch(e) {
    return null;
  }
}

console.log('=> load data');
var data = loadData('data');

console.log('=> load helpers');
var H = loadHelpers('helpers');
if(!H) {
  console.log('No helper found : "helper/H.js"')
}

console.log('=> generate');
generate(data, 'templates', 'build');
