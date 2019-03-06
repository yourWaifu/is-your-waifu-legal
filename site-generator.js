"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
let outputDirName = "output-site";
let inputFilename = "copy-to-site.json";
// https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js
function copyFileSync(source, target) {
    let targetFile = target;
    if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
    }
    fs.writeFileSync(targetFile, fs.readFileSync(source));
}
function copyFolderRecursiveSync(source, target) {
    let files = [];
    let targetFolder = path.join(target, path.basename(source));
    if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder);
    }
    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            let curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, targetFolder);
            }
            else {
                copyFileSync(curSource, targetFolder);
            }
        });
    }
}
function copyFilesInFolderSync(source, target) {
    let files = [];
    //copy
    if (fs.lstatSync(source).isDirectory()) {
        files = fs.readdirSync(source);
        files.forEach(function (file) {
            let curSource = path.join(source, file);
            if (fs.lstatSync(curSource).isDirectory()) {
                copyFolderRecursiveSync(curSource, target);
            }
            else {
                copyFileSync(curSource, target);
            }
        });
    }
}
class InputType {
    deserialize(input) {
        if (input.hasOwnProperty("copy-directories"))
            this.copyDirectories = input["copy-directories"];
        else
            this.copyDirectories = [];
        if (input.hasOwnProperty("copy-files-in-directories"))
            this.copyFilesInDirectories = input["copy-files-in-directories"];
        else
            this.copyFilesInDirectories = [];
        return this;
    }
}
if (!fs.existsSync(outputDirName)) {
    fs.mkdirSync(outputDirName);
}
let input = new InputType().deserialize(require("./" + inputFilename));
input.copyDirectories.forEach(function (directory) {
    copyFolderRecursiveSync(directory, outputDirName);
});
input.copyFilesInDirectories.forEach(function (file) {
    copyFilesInFolderSync(file, outputDirName);
});
