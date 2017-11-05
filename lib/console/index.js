const console = require('console');

if (typeof console.group !== 'function') {
	const {log, error} = console;
	let indent = '';
	Object.assign(
		console,
		{
			group() {
				indent += '  ';
			},
			groupEnd() {
				indent = indent.slice(2);
			},
			log(...args) {
				args.unshift(indent);
				log(...args);
			},
			error(...args) {
				args.unshift(indent);
				error(...args);
			},
		}
	);
}

module.exports = console;
