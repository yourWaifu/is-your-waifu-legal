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
let indexPage : string = fs.readFileSync("README.md").toString();
let indexHeader : string =
	"---\n" +
	"layout: readme\n" +
	"---\n";
//replace first line with indexHeader
indexPage = indexHeader + indexPage.substring(indexPage.indexOf('\n') + 1);
fs.writeFile(path.join(outputDirName, "README.md"), indexPage, ()=>{});

//generate trie tree
let numOfLettersInAlphabet = 127;

namespace SearchTree {
	class Branch {
		children: Array<Branch> | undefined;
		//if value is not null, then we are at the end
		value: undefined | number;
		constructor() {
			this.children = undefined;
		}
		createChild(index: number) : Branch {
			if (this.children === undefined)
				this.children = new Array<Branch>(numOfLettersInAlphabet);
			this.children[index] = new Branch();
			return this.children[index];
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
			let key: string = sourceKey.substr(0, sourceKey.indexOf('.'));
			let value:number = this.allKeys.push(key) - 1;
			let position : Branch = this.root;
			for (let i:number = 0; i < key.length; ++i) {
				//for now, keys must be in the alphabet. We might want to change this later
				if (key.charCodeAt(i) < ' '.charCodeAt(0) ||
					(
						'A'.charCodeAt(0) <= key.charCodeAt(i) &&
						key.charCodeAt(i) <= 'Z'.charCodeAt(0)
					) ||
					(1 << 7) <= key.charCodeAt(i)
				)
					throw "Error: key " + key + " has char outside of a to z.";
				
				let index: number = key.charCodeAt(i) - ' '.charCodeAt(0);
				//basically position = position.children[index];
				if (position === undefined)
					throw "position is undefined";
				if (position.children === undefined || position.children[index] === undefined) {
					position = position.createChild(index);
				} else {
					position = position.children[index];
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

fs.writeFile(path.join(outputDirName, "search-tree.json"), JSON.stringify(searchTree), ()=>{});