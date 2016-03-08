var fs = require("fs");
var path = require("path");
var async = require("async");

module.exports = {
    walk: walk,
    walkSync: walkSync
};

function walk(dir, callback, filters) {
  if(filters != null) {
    for (var j = 0; j < filters.length; j++) {
      if (dir.indexOf(filters[j]) != -1) {
        return
      }
    }
  }
  fs.readdir(dir, callbackForReaddir(dir, callback, filters));
}

function callbackForReaddir(dir, callback, filters) {
  return (function(err, list) {
    if (err) {
      console.log(err);
      return;
    }
    if(!list) {
      return;
    }
    for(var i=0; i<list.length; i++) {
      var file = list[i];
      //console.log('walk - file',file);
      async.setImmediate(
        callbackForReaddirAction(dir, file, callback, filters)
      );
    }
  });
}

function callbackForReaddirAction(dir, file, callback, filters) {
  return (function() {
    var full = path.join(dir, file);
    //console.log('walk callback - file',full);
    fs.lstat(full, callbackForlstat(dir, file, full, callback, filters));
  });
}

function callbackForlstat(dir, file, full, callback, filters) {
  return (function (err, stat) {
    //console.log('stat', stat);
    if (stat && stat.isDirectory()) {
      walk(full, callback, filters);
    }
    if (stat && stat.isFile()) {
      //console.log('walk callback - file',file);
      callback(path.join(dir, file));
    }
  });
}

// Sync

function walkSync(dir, filters) {
  //console.log('walk ',dir);
  var result = [];
  walkSyncRecursive(dir, result, filters);
  return result;
}

function walkSyncRecursive(dir, results, filters) {

  if(filters) {
    for (var j = 0; j < filters.length; j++) {
      if (dir.indexOf(filters[j]) != -1) {
        return;
      }
    }
  }

  var list = fs.readdirSync(dir);
    for(var i=0; i<list.length; i++) {
        var file = list[i];
        if (!file) {
            // nothing
        } else {

            file = path.join(dir, file);
            var stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                var res = walkSyncRecursive(file, results, filters);
            } else {
                results.push(file);
            }
        }
    }
    return results;
}

/*
var walk = function(dir) {
    var files = {};
    var res = _walkSync(dir);
    for(var i=0; i<res.length; i++) {
        var file = res[i];
        var filename = file.substring(file.lastIndexOf('/'));
        files[filename] = file;
    }
    return files;
}
*/
