#!/usr/bin/env node

const console = require('console');
const path = require('path');
const {spawn} = require('child_process');
const packageJSON = require('../package.json');
function exitProcess(exitCode) {
	process.exit(exitCode);
}

class CLI {

	static get package() {
		return packageJSON;
	}

	static get version() {
		return this.package.version;
	}

	static get help() {
		return [
			'',
			`@nlib/test@${this.version}`,
			'A test runner',
			'',
			'Usage: nlib-test [options] script1.js...',
			'',
			'options:',
			'  -v, --version   print nlib-test version',
			'  -h, -H, --help  show help',
			'',
		].join('\n');
	}

	static get hr() {
		return `--------${CLI.package.name}--------`;
	}

	constructor(args = process.argv.slice(2), options = {}) {
		const {
			stdin = process.stdin,
			stdout = process.stdout,
			stderr = process.stderr,
		} = options;
		Object.assign(
			this,
			{
				args,
				stdin,
				stdout,
				stderr,
			}
		);
	}

	get stdio() {
		return [this.stdin, this.stdout, this.stderr];
	}

	has(...triggers) {
		return 0 <= triggers.findIndex((trigger) => {
			return this.args.includes(trigger);
		});
	}

	run(callback = exitProcess) {
		if (this.has('-h', '-H', '--help', '-help')) {
			console.log(CLI.help);
			callback(0);
		} else if (this.has('-v', '-V', '--version', '-version')) {
			console.log(CLI.version);
			callback(0);
		} else {
			this.runScripts(this.args, 0, callback);
		}
	}

	runScripts(
		filePaths,
		exitCode = 0,
		callback = exitProcess
	) {
		const filePath = filePaths.shift();
		if (filePath) {
			this.runScript(filePath)
			.then((code) => {
				this.runScripts(filePaths, exitCode || code, callback);
			});
		} else if (0 < filePaths.length) {
			this.runScripts(filePaths, exitCode, callback);
		} else {
			callback(exitCode);
		}
	}

	runScript(filePath, ...args) {
		const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
		args.unshift(absoluteFilePath);
		const label = `${process.argv0} ${args.join(' ')}`;
		console.time(label);
		console.log(`\n${label}\n${CLI.hr}`);
		return new Promise((resolve) => {
			spawn(process.argv0, args, {stdio: this.stdio})
			.once('error', (error) => {
				resolve(1, error);
			})
			.once('close', resolve);
		})
		.then((code, error) => {
			console.log(CLI.hr);
			console.timeEnd(label);
			console.log(`exit code: ${code}`);
			if (error) {
				console.error(error);
			}
			return code;
		});
	}

}

if (module.parent) {
	module.exports = CLI;
} else {
	new CLI().run();
}
