import * as fs from "fs";
import * as path from "path";

let outputDirName : string = "output-site";
let inputFilename : string = "copy-to-site.json";

// https://stackoverflow.com/questions/13786160/copy-folder-recursively-in-node-js

function copyFileSync(source: string, target: string) : void {
	let targetFile : string = target;

	if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
		targetFile = path.join(target, path.basename(source));
	}

	fs.writeFileSync(targetFile, fs.readFileSync(source));
}

function copyFolderRecursiveSync(source: string, target: string) : void {
	let files : Array<string> = [];

	let targetFolder : string = path.join(target, path.basename(source));
	if (!fs.existsSync(targetFolder)) {
		fs.mkdirSync(targetFolder);
	}

	//copy
	if (fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function(file: string) {
			let curSource = path.join(source, file);
			if (fs.lstatSync(curSource).isDirectory()) {
				copyFolderRecursiveSync(curSource, targetFolder);
			} else {
				copyFileSync(curSource, targetFolder);
			}
		});
	}
}

function copyFilesInFolderSync(source: string, target: string) : void {
	let files: Array<string> = [];

	//copy
	if (fs.lstatSync(source).isDirectory()) {
		files = fs.readdirSync(source);
		files.forEach(function(file: string) {
			let curSource = path.join(source, file);
			if (fs.lstatSync(curSource).isDirectory()) {
				copyFolderRecursiveSync(curSource, target);
			} else {
				copyFileSync(curSource, target);
			}
		});
	}
}

class InputType {
	copyDirectories: Array<string>;
	copyFilesInDirectories: Array<string>;
	deserialize(input: any) : InputType {
		if (input.hasOwnProperty("copy-directories"))
			this.copyDirectories = <Array<string>>input["copy-directories"];
		else
			this.copyDirectories = [];

		
		if (input.hasOwnProperty("copy-files-in-directories"))
			this.copyFilesInDirectories = <Array<string>>input["copy-files-in-directories"];
		else
			this.copyFilesInDirectories = [];

		return this;
	}
}

if (!fs.existsSync(outputDirName)) {
	fs.mkdirSync(outputDirName);
}

let input : InputType = new InputType().deserialize(require("./" + inputFilename));

input.copyDirectories.forEach(function(directory: string) {
	copyFolderRecursiveSync(directory, outputDirName);
});
input.copyFilesInDirectories.forEach(function(file:string){
	copyFilesInFolderSync(file, outputDirName);
});

