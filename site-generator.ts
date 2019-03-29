import * as fs from "fs";
import * as path from "path";

let outputDirName : string = "output-site";
let inputFilename : string = "site-generator-config.json";

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
	constructor(input: any) {
		if (input.hasOwnProperty("copy-directories"))
			this.copyDirectories = <Array<string>>input["copy-directories"];
		else
			this.copyDirectories = [];

		
		if (input.hasOwnProperty("copy-files-in-directories"))
			this.copyFilesInDirectories = <Array<string>>input["copy-files-in-directories"];
		else
			this.copyFilesInDirectories = [];
	}
}

if (!fs.existsSync(outputDirName)) {
	fs.mkdirSync(outputDirName);
}

let input : InputType = new InputType(require("../" + inputFilename));

input.copyDirectories.forEach(function(directory: string) {
	copyFolderRecursiveSync(directory, outputDirName);
});
input.copyFilesInDirectories.forEach(function(file:string){
	copyFilesInFolderSync(file, outputDirName);
});

//generate main page
let indexPage : string = fs.readFileSync("README.md", "utf8");
let indexHeader : string =
	"---\n" +
	"layout: readme\n" +
	"---\n";
//replace first line with indexHeader
indexPage = indexHeader + indexPage.substring(indexPage.indexOf('\n') + 1);
fs.writeFile(path.join(outputDirName, "README.md"), indexPage, ()=>{});

//generate trie tree
namespace SearchTree {
	class Branch {
		children: any | undefined;
		//if value is not null, then we are at the end
		value: undefined | number;
		constructor() {
			this.children = undefined;
		}
		createChild(key: string) : Branch {
			if (this.children === undefined)
				this.children = {};
			this.children[key] = new Branch();
			let l = this.children[key];
			return l !== undefined ? l : new Branch();
		}
		setValue(value:number) : void {
			this.value = value;
		}
	};

	export class Tree {
		allKeys: Array<string>;
		root:Branch;
		constructor() {
			this.allKeys = [];
			this.root = new Branch();
		}
		insert(sourceKey: string) : void {
			let key: string = sourceKey.substr(0, sourceKey.lastIndexOf('.'));
			let value:number = this.allKeys.push(key) - 1;
			let position : Branch = this.root;
			for (let i:number = 0; i < key.length; ++i) {
				let letter: string = key[i];
				//basically position = position.children[letter];
				if (position === undefined)
					throw "position is undefined";
				if (position.children === undefined) {
					position = position.createChild(letter);
				} else {
					let next: Branch | undefined = position.children[letter];
					if (next === undefined)
						position = position.createChild(letter);
					else
						position = next;
				}
				if (position.value === undefined)
					position.setValue(value);
			}
		}
	}
}

let searchTree : SearchTree.Tree = new SearchTree.Tree();
let waifuFiles = fs.readdirSync("waifus");
waifuFiles.sort().forEach(function(file:string) {
	searchTree.insert(file);
});

let searchTreeJson: string = JSON.stringify(searchTree);
//replace repeated variables with shorten names
searchTreeJson = searchTreeJson.replace(/"children":/g, "\"c\":");
searchTreeJson = searchTreeJson.replace(/"value":/g, "\"v\":");

fs.writeFile(path.join(outputDirName, "search-tree.json"), searchTreeJson, ()=>{});