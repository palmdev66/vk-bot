const SHOULD_BE = "@";
const IGNORE = ["http", "vk.cc", "#", "@"];
const OUTPUT = "./words.json";
const GROUP = -57536014;

const VK = require("vk-io");

const vk = new VK();
const fs = require("fs");

function analyzeBugurtThread() {
	return new Promise(function(resolve, reject) {
		var _words = [];
		var maxindex = 10000; // Установить 0 если надо просканить все посты

		function once(offset) {
			vk.api.wall.get({
				offset: offset,
				count: 100,
				owner_id: GROUP
			}).then(function(wall) {
				if (!maxindex) {
					maxindex = wall.count
				} else {
					if (offset >= maxindex) return resolve(_words);
				}

				console.log(offset + "/" + maxindex + "| Слов: " + _words.length);

				wall.items.forEach(function(post) {
					if (post.text.indexOf(SHOULD_BE) == -1) return;

					var lines = post.text.split("@");

					lines = lines.filter(l => !!IGNORE.find(i => l.toLowerCase().indexOf(i) == -1));

					var words = lines.join(" ").split(" "); // Выглядит лолзово, но так и надо

					words.forEach(function(_word) {
						const word = _word.split("\n")[0].toLowerCase();

						if (_words.indexOf(word) == -1) {
							_words.push(word);
						}						
					});
				});

				once(offset + 100);
			});
		}

		once(0);
	});
}

function analyzeAndSave() {
	console.log("Анализирую бугурт-тред");

	analyzeBugurtThread().then(function(words) {
		console.log("Сохраняю слова");

		fs.writeFile(OUTPUT, JSON.stringify(words), function() {
			console.log("Все ;d");
		});
	});
}

analyzeAndSave();