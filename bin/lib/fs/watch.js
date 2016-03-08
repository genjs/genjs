var chokidar = require('chokidar');

module.exports = {
  watch: watch
};

/**
 * Watch files lifecycles.
 * @param directory Root directory
 * @param callback Callback function for each file modification
 * @param isIgnored Function to check which directories are ignored for watching
 */
function watch(directory, callback, isIgnored) {
  if(Array.isArray(directory)) {
    return watchDirectories(directory, callback, isIgnored);
  } else {
    return watchDirectory(directory, callback, isIgnored);
  }
}

function watchDirectories(directories, callback, isIgnored) {
  if(directories.length === 0) {
    return null;
  }
  var chokidarWatcher = watchDirectory(directories[0], callback, isIgnored);
  for(var i=1; i<directories.length; i++) {
    chokidarWatcher.add(directories[i]);
  }
  return chokidarWatcher;
}

function watchDirectory(directory, callback, isIgnored) {
  var chokidarWatcher = chokidar.watch(directory, {
    ignored: ignore(isIgnored),
    persistent: true
  });
  chokidarWatcher.on('add', defineCallback('change', callback));
  chokidarWatcher.on('change', defineCallback('change', callback));
  chokidarWatcher.on('unlink', defineCallback('delete', callback));
  return chokidarWatcher;
}

function ignore(isIgnored) {
  var lastDateByPaths = {};
  var isIgnoredByPaths = {};
  return function(path, fsStats) {
    if (fsStats == null) {
      return false;
    }
    if (isIgnoredByPaths[path] != null) {
      return isIgnoredByPaths[path];
    }
    var ignore = true;
    var date = new Date().getTime();
    if (lastDateByPaths[path] == null || date - lastDateByPaths[path] > 1000) {
      lastDateByPaths[path] = date;
      if(isIgnored == null) {
        ignore = false;
      } else {
        ignore = isIgnored(path, fsStats);
      }
      isIgnoredByPaths[path] = ignore;
    }
    if (ignore) {
      console.log("ignore for watching : " + path);
    } else {
      //console.log("watch: " + path);
    }
    return ignore;
  }
}

function isIgnoredDefault(filename, fsStats) {
  if (filename.indexOf('___jb_bak___') != -1) {
    return true;
  }
  if (filename.indexOf('.DS_Store') != -1) {
    return true;
  }
  if (filename.indexOf('.git') != -1) {
    return true;
  }
  if (filename.indexOf('.settings') != -1) {
    return true;
  }
  if (filename.indexOf('.idea') != -1) {
    return true;
  }
  if (filename.indexOf('node_modules') != -1) {
    return true;
  }
  if (filename.indexOf('bower_components') != -1) {
    return true;
  }
  if (filename.indexOf('target') != -1) {
    return true;
  }
  return false;
}

function defineCallback(action, callback) {
  var lastDate = null;
  return function(file, config) {
    var date = new Date().getTime();
    if (lastDate == null || date - lastDate > 1000) {

      callback(action, file);

      lastDate = date;
    }
  };
}
