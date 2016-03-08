'use strict'

var path = require('path');
var requireReload = require('./requireReload');
var fs = require('fs');
var mkdirp = require('mkdirp');

module.exports = {
  absolute: absolute,
  requireReload: requireReload,
  fileInfo: fileInfo,
  readFile: readFile,
  writeFile: writeFile,
  existsFile: existsFile,
  copyFile: copyFile,
  areDifferentFiles: areDifferentFiles
};

function absolute(rootDir, dir) {
  if (dir == null) {
    dir = rootDir;
  }
  if (dir == null) {
    return undefined;
  }

  if (path.isAbsolute(dir)) {
    return dir;
  }

  if (rootDir == null) {
    rootDir = process.cwd();
  }
  return path.join(rootDir, dir);
}

function readYaml(file) {
  try {
    return yaml.safeLoad(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log('Error : bad model entity YAML file : ', file);
    throw e;
  }
}

function readIml(file) {
  try {
    return iml.iml2js(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.log('Error : bad model entity YAML file : ', file);
    throw e;
  }
}

/**
 * Get file informations.
 * @param file Relative path to file : "domain/entities/application.yml"
 * @return file informations :
 * {
 *   full: "domain/entities/application.yml",
 *   filename: "application.yml",
 *   basename: "application",
 *   ext: "yml",
 *   dirname: "domain/entities",
 *   dirs: ["domain", "entities"]
 * }
 */
function fileInfo(file) {
  // Sample : file = "domain/entities/application.yml"
  var filename = path.basename(file);
  var ext = path.extname(file); // "domain/entities/application.yml" -> ".yml"
  var basename = path.basename(file, ext); // "domain/entities/application.yml", ".yml" -> "application"
  if(ext != null && ext.length > 0) {
    ext = ext.substring(1); // ".yml" -> "yml"
  }
  var dirname = path.dirname(file); // "domain/entities/application.yml" -> "domain/entities"
  var dirs = dirname.split(path.sep); // "domain/entities" -> ["domain", "entities"]
  return {
    full: file,
    filename: filename,
    basename: basename,
    ext: ext,
    dirname: dirname,
    dirs: dirs
  };
}

/**
 * Read file content
 * @param file Filename
 * @return file content
 */
function readFile(file) {
  // Read existing file
  try {
    return fs.readFileSync(file, 'utf8');
  } catch(e) {
    throw e;
  }
}

/**
 * Write file content
 * @param file Filename
 * @param content Content to write
 */
function writeFile(file, content) {
  // Create if not exists
  var outDir = path.dirname(file);
  mkdirp.sync(outDir);

  // Read existing file
  try {
    var existing = fs.readFileSync(file, 'utf8');
  } catch(e) {
    var existing = undefined;
  }

  // Write file content if newer
  if(content != existing) {
    fs.writeFileSync(file, content, 'utf-8');
    fs.utimes(file, new Date(), new Date(), function () {
    });
  }
}

/**
 * Indicates if the file exists
 * @param file
 */
function existsFile(file) {
  try {
    fs.readFileSync(file, 'utf8');
    return true;
  } catch(e) {
    return false;
  }
}

/**
 * Copy file
 * @param file Input file
 * @param outFile Output file
 */
function copyFile(file, outFile) {
  if(!existsFile(outFile) || areDifferentFiles(file, outFile)) {
    mkdirp(path.dirname(outFile), function(e) {
      if(e) { throw e; }
      fs.createReadStream(file).pipe(fs.createWriteStream(outFile));
    });
  }
}

/**
 * Indicates if files are differents
 * @param file1 File 1
 * @param file2 File 2
 * @return boolean
 */
function areDifferentFiles(file1, file2) {
  return fs.statSync(file1)["size"] !== fs.statSync(file2)["size"];
}
