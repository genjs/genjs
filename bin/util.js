
var fs = require('fs');
var path = require('path');
var inquirer = require("inquirer");
var mkdirp = require('mkdirp');
var Q = require('Q');

module.exports = {
  getCommands: getCommands,
  exec: exec
};

function getCommands(argv) {
  var commands = [];
  if (argv.length > 1) {
    var hasOptionValue = false;
    for (var i = 2; i < process.argv.length; i++) {
      if (process.argv[i].charAt(0) != '-') {
        if (hasOptionValue) {
          hasOptionValue = false;
        } else {
          commands.push(process.argv[i]);
        }
      } else {
        hasOptionValue = true
      }
    }
  }
  return commands;
}

function exec(command, options) {

  var exec = require("child_process").exec;

  if(options == null) {
    var options = {stdio: "pipe"};
  } else {
    options.stdio = "pipe";
  }

  var deferred = Q.defer();

  if(options.cwd != null) {
    console.log('=>', command,' in',options.cwd);
  } else {
    console.log('=>', command);
  }
  var child = exec(command, options);
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on("close", function () {
    child.stdout.end();
    child.stdin.end();
    deferred.resolve();
  });

  return deferred.promise;
}
