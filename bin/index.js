#!/usr/bin/env node
'use strict';
var U = require('./util');
var _ = require('lodash');
var gutil = require('gutil');
var filesystem = require('./lib/fs/filesystem');
var mkdirp = require('mkdirp');
var path = require('path');
var ljs = require('ljs-template');

process.title = 'genjs';

doInit();

/*
start();

function start() {
  console.log('## GenJS ##');
  var commands = U.getCommands(process.argv);
  console.log(commands);
  _.each(commands, function(command) {
    startCommand(command);
  })
}

function startCommand(command) {
  console.log('command:',command);
  switch(command) {
    case 'init':
      doInit();
      break;
  }
}
*/

function doInit() {
  console.log('Init');

  // Create directories :
  var dirs = [
    'data',
    'helpers',
    'templates'
  ];
  _.each(dirs, function(dir) {
    console.log('=> Create directory :', dir);
    mkdirp(dir);
  });

  // create files :
  var files = [
    'index.js',
    'package.json',
    'nodemon.json',
    path.join('helpers','H.js')
  ]
  _.each(files, function(file) {
    if(!filesystem.existsFile(file)) {
      console.log('=> Create file :', file);
      filesystem.copyFile(path.join(__dirname,'files',file), file);
    } else {
      console.log('=> File already exists:', file);
    }
  });

  // npm install
  U.exec('npm install')
    .then(function() {
      doInitEnd();
    });
}

function doInitEnd() {
  // Display run command
  console.log('Run GenJS with : " npm start "');
  U.exec('npm start')
    .then(function() {

    });
}
