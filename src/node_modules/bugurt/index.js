Array.prototype.random = function() {
	return this[random(this.length)];
}

function random(n) {
	return Math.floor(Math.random() * n) + 1;
}

function bugurt(options) {
	const maxLines = options.maxLines || 8;
	const lines = options.lines || null;
	const maxWordsOnLine = options.maxWordsOnLine || 13;
	const file = options.file || "./words.json";

	const words = require(file);

	return "@\n" 
		+ Array(lines || random(maxLines)).fill(1)
			.map(e => Array(random(maxWordsOnLine)).fill(1)
						.map(ee => words.random()).join(" ")
				).join("\n@\n").toUpperCase();
}

module.exports = bugurt;