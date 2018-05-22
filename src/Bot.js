const vk        	= new (require('vk-io')),
	request     	= require('request'),
	BOTID   		= 12345678910; //ID Страницы бота
	http 			= require("http"),
	https 			= require("https"),
	cfg 			= require("./cfg/cfg.js"),
 
vk.setToken('xxx');
vk.longpoll.start();

let Canvas = require('canvas');
let commands = [];
let fs = require('fs')
let users = require("./base/users.json")

vk.longpoll.on('message', (message) => {
	if(message.user == BOTID) return;
	if(!users[message.user])
		users[message.user] = {balance: cfg.startmoney, btc: cfg.startbtc, usd: cfg.startusd};
    commands.map(function (cmd) {
		if(!cmd.r.test(message.text))return;
		message.photo = (src, filename) => message.sendPhoto( { value: src, options: { filename: filename } } );
		let params = message.text.match(cmd.r) || []; 
		console.log(`@${message.user} | ${message.text}`)
        params[0] = message; 
        cmd.f(message, params);
    });
});

if (cfg.automoney == true) {
	setInterval(() => {
		for(let id in users) {
			if(users[id].balance <= 1)
				users[id].balance = 1000;
		}
	}, 60000)
}

if (cfg.autostatus == true) {
	setInterval(() => {
		let time = process.uptime();
		let uptime = (time + "").toHHMMSS();
		vk.api.call("account.saveProfileInfo", {
			status: `🍀 Ник бота | Аптайм: ` + uptime + ` 🍃`
		})
	}, 60000)
}

if (cfg.autoaccept == true) {
	setInterval(() => {
		vk.api.call('friends.getRequests', {})
		.then(res => {
			if(res.count == 0) return;
			res.items.map(x => {
				vk.api.call('friends.add', { user_id: x })
				.catch(() => { vk.api.call('friends.delete', { user_id: x }) })
			});
		})
		vk.api.call('friends.getRequests', {out: 1})
		.then(res => {
			if(res.count == 0) return;
			res.items.map(x => { vk.api.call('friends.delete', { user_id: x }) })
		})
	}, 60000)
}

setInterval(() => {
	fs.writeFileSync("./base/users.json", JSON.stringify(users, null, "\t"));
}, 10000);

String.prototype.toHHMMSS = function () {
    let sec_num = parseInt(this, 10);
    let hours   = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    let seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    let time    = hours+':'+minutes+':'+seconds;
    return time;
}

function command(_regex, _desc, _func, _lvl) {
    commands.push({r: _regex, f: _func, d: _desc, l: _lvl});
}

function rand(text) {
	let tts = Math.floor(text.length * Math.random())
	return text[tts]
}
 

// User commands


command(/^\/(помощь|help)/i, 'none', function (message, params) {
	return message.send("🌖Команды бота:\n" + commands.filter(e => e.d != 'none').map(x => x.d).join("\n"));
});

command(/^\/(я|me)/i, '🔹/я -- Информация о вас', function (message, params) {
	return message.reply(`Информация о [id` + message.user + '|тебе]:\n\n' + 
	'Валюта: \n' + 
	'💰 Монеты: ' + users[message.user].balance + '\n' +
	'💳 Биткоины: ' + users[message.user].btc + '\n' +
	'💸 Доллары: ' + users[message.user].usd
	);
});

command(/^\/(transfer|перевод)\s([^]+)\s([0-9]+)/i, '🔹/перевод <ссылка> [монеты] -- Перевести монеты', function (message, params) {
	if(users[message.user].balance < params[2]) return message.reply('У тебя недостаточно средств 🙁');
	if(params[2] < 500) return message.reply('Минимальный перевод - 500 монет 🙁');
	let userid = (params[2]);
	let cutid = userid.substr(15);
	vk.api.call("utils.resolveScreenName", {
		screen_name: cutid
	}).then(res => {
		users[message.user].balance -= Number(params[3]);
		users[res.object_id].balance += Number(params[3]);
		return message.reply(`Сумма перевода - ` + params[3] + `\nID Получателя - ` + cutid + `\nТвой баланс - ${users[message.user].balance} монет💶`);
	})
});

command(/^\/(btc|бтк) (sell|buy)\s([0-9]+)/i, '🔹/бтк <sell|buy> [кол-во] -- Продать/Купить биткоин', function (message, params) {
	if(params[2] === "sell") {
		request.get('https://blockchain.info/ru/ticker', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		if(users[message.user].btc <= 0) {
			return message.reply(`У тебя нет биткоинов 🙁`);
		}
		users[message.user].btc -= Number(params[3]);
		users[message.user].balance += Math.round(data.RUB.sell * params[3]);
		return message.reply(`Вы продали биткоины [` + params[3] +  ` шт.] за ` + Math.round(data.RUB.sell * params[3]) + ` монет 💴`);
		})
	}
	if(params[2] === "buy") {
		request.get('https://blockchain.info/ru/ticker', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		if(users[message.user].balance <= Math.round(data.RUB.buy * params[3])) {
			return message.reply(`У тебя недостаточно средств для покупки биткоинов [` + params[3] + ` шт.] 🙁`);
		}
		users[message.user].btc += Number(params[3]);
		users[message.user].balance -= Math.round(data.RUB.buy * params[3]);
		return message.reply(`Вы купили биткоины [` + params[3] + ` шт.] за ` + Math.round(data.RUB.buy * params[3]) + ` монет 💴`);
		})
	}
});

command(/^\/(длр|usd) (sell|buy)\s([0-9]+)/i, '🔹/длр <sell|buy> [кол-во] -- Продать/Купить доллар', function (message, params) {
	if(params[2] === "sell") {
		request.get('https://www.cbr-xml-daily.ru/daily_json.js', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		if(users[message.user].usd <= 0) {
			return message.reply(`У тебя нет долларов 🙁`);
		}
		users[message.user].usd -= Number(params[3]);
		users[message.user].balance += Math.round(data.Valute.USD.Value * params[3]);
		return message.reply(`Вы продали доллары [` + params[3] +  ` шт.] за ` + Math.round(data.Valute.USD.Value * params[3]) + ` монет 💴`);
		})
	}
	if(params[2] === "buy") {
		request.get('https://www.cbr-xml-daily.ru/daily_json.js', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		if(users[message.user].balance <= Math.round(data.Valute.USD.Value * params[3])) {
			return message.reply(`У тебя недостаточно средств для покупки долларов [` + params[3] + ` шт.] 🙁`);
		}
		users[message.user].usd += Number(params[3]);
		users[message.user].balance -= Math.round(data.Valute.USD.Value * params[3]);
		return message.reply(`Вы купили доллары [` + params[3] + ` шт.] за ` + Math.round(data.Valute.USD.Value * params[3]) + ` монет 💴`);
		})
	}
});

command(/^\/(course|курс) (usd|btc)/i, '🔹/курс <usd|btc> -- Курс валюты', function (message, params) {
	if(params[2] === "btc") {
		request.get('https://blockchain.info/ru/ticker', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		return message.reply(`Курс биткоина - ` + Math.round(data.RUB.sell) + ` рублей (монет) 💴\nПродать/Купить биткоин - /бтк <sell|buy> [кол-во]`);
		})
	}
	if(params[2] === "usd") {
		request.get('https://www.cbr-xml-daily.ru/daily_json.js', (e,r,b) => {
			if(e) return
			let data = JSON.parse(b)
		return message.reply(`Курс доллара - ` + Math.round(data.Valute.USD.Value) + ` рублей (монет) 💴\nПродать/Купить доллар - /длр <sell|buy> [кол-во]`);
		})
	}
});

command(/^\/(roll|рулетка)\s([0-9]+)/i, '🔹/рулетка <монеты> -- Рулетка', function (message, params) {
	if(users[message.user].balance <= 0) return message.reply('У тебя недостаточно средств 🙁');
	if(Number(params[2]) > users[message.user].balance) return message.reply('У тебя недостаточно средств 🙁');
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	if(getRandomInt(0, 100) < 50) {
		users[message.user].balance += Number(params[2]);
		return message.reply(`Ты выиграл ${params[2]} монет :-D\nТеперь у тебя ${users[message.user].balance} монет` + smiles);
	}else{
		users[message.user].balance -= Number(params[2]);
		return message.reply(`Ты проиграл ${params[2]} монет 3(\nТеперь у тебя ${users[message.user].balance} монет` + smiles);
	}
});

command(/^\/(пост|post)\s([^]+)/i, '🔹/пост <текст> -- Пост на странице бота', function (message, params) {
	if(users[message.user].balance <= 49999) return message.reply('У тебя недостаточно средств 🙁 Цена - 50000 монет');
	users[message.user].balance -= 50000;
	vk.api.call("wall.post", { owner_id: 438994938, message: params[2] + '\n' + '\nОпубликовал: ' + 'https://vk.com/id' + message.user })
	return message.reply(`Пост успешно опубликован🌿\nС тебя снято 50000 монет💴`);
});

command(/^\/(лайк|like)/i, '🔹/лайк -- Лайк на аву', function (message, params) {
	if(users[message.user].balance <= 4999) return message.reply('У тебя недостаточно средств 🙁 Цена - 5000 монет');
	users[message.user].balance -= 5000;
	vk.api.call("users.get", {
		user_ids: message.user,
		fields: "photo_id"
	  }).then((res) => {
		let itid = res[0].photo_id.toString().split("_");
		vk.api.call("likes.add", {
		  type: "photo",
		  owner_id: message.user,
		  item_id: itid[1]
		})
	  })
	return message.reply(`Лайк успешно поставлен🌿\nС тебя снято 5000 монет💴`);
});

command(/^\/(cit|цит)/i, '🔹/цит <прикрепленное сообщение> -- Цитата', function (message, params, bot) {
	if(!message.hasFwd()) return;
    let canvas = new Canvas(1400,600);
    let Image = Canvas.Image;

    vk.api.call('messages.getById', {
        message_ids: message.id
    }).then((res) => {
        let body = res.items[0].fwd_messages.map(e => e.body).join('\n');
        fs.readFile('./base/citSample/tsitka.png', function(err, squid) {
            let ctx = canvas.getContext('2d');
            let img = new Image();
            img.src = squid;
            ctx.drawImage(img, 0, 0, 1400, 600);
            vk.api.users.get({
                user_ids: res.items[0].fwd_messages[0].user_id,
                fields: "photo_max"
            }).then((r) => {
                imageFromUrl(r[0].photo_max, function(image) {
                    let ctx = canvas.getContext('2d');
                    let Font = Canvas.Font;
                    let CoreSansE = new Font('CoreSansE-25ExtraLight', __dirname + '/base/fonts/CoreSansE-25ExtraLight.otf');
                    ctx.beginPath();

                    ctx.addFont(CoreSansE);
                    ctx.font = '45px "Core Sans E 25 ExtraLight"';
                    ctx.fillStyle = "white";
                    ctx.fillText("«" + body.match(/.{1,33}/g).join("\n") + "»", 600, 140);

                    let ctx = canvas.getContext('2d');
                    ctx.addFont(CoreSansE);
                    ctx.font = '75px "Core Sans E 25 ExtraLight"';
                    ctx.fillStyle = "white";
                    ctx.textAlign = "center";
                    ctx.fillText(r[0].first_name + " " + r[0].last_name, 980, 70);

                    ctx.drawImage(image, 25, 25, 550, 550);
                    message.photo(canvas.toBuffer(), 'cit.png');
                })
            })
        });
    })
});

command(/^\/(кто|who)\s([^]+)/i, '🔹/кто <текст> -- Кто есть кто', function (message, params) {
	let phrases = rand(['Я знаю, это', 'Это же очевидно, это', 'Вангую, это', 'Как не понять, что это', 'Инфа сотка, что это', 'Конечно-же это', 'Естественно это'])
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	vk.api.call("messages.getChatUsers", {
		chat_id: message.chat,
		fields: "photo_100"
	}).then(function (res) {
		let user = res.filter(a=> !a.deactivated && a.type == "profile").map(a=> a)
		user = rand(user);
		return message.reply(phrases + ` - [id` + user.id + `|` + user.first_name + ` ` + user.last_name + `]` + smiles);
	})
});

command(/^\/(инфа|info)\s([^]+)/i, '🔹/инфа <текст> -- Вероятность инфы', function (message, params) {
	let numbers = rand([1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100])
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	return message.reply(`Вероятность инфы ` + numbers + `%` + smiles);
});

command(/^\/(шар|ball)\s([^]+)/i, '🔹/шар <текст> -- Предсказание', function (message, params) {
	let phrases = rand([`Скорее всего, это так..`,`Может быть`,`Никак нет!`,`Уверен на все сто!`,`Сомневаюсь в этом.`,`Даже незнаю`])
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	return message.reply(phrases + ` ` + smiles);
});

command(/^\/(where|где)\s([^]+)/i, '🔹/где <имя> -- Где находится человек', function (message, params) {
	let gg = rand(['Отвечаю', 'Ну это же очевидно', 'Конечно-же'])
	let phrases = rand([`лысого гоняет`,`прыгает с высотки Москвы`,`в падике с бомжами`,`учит математику`,`исправляет 2 по русскому`,`на хате у друга`,`в душе моется`,`дерется с алкашами`,`разговаривает с мамкой по мобиле`])
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	return message.reply(gg + `, ` + phrases + ` ` + smiles);
});

command(/^\/(chat|чат)/i, '🔹/чат -- Беседа бота', function (message, params) {
	return vk.api.call("messages.addChatUser", { user_id: message.user, chat_id: 33 })
	.catch(() => message.reply(`Ты уже есть в беседе, или не добавил бота в друзья😐`))
});


// Admin commands


command(/^\/givemoney\s([^]+)\s([0-9]+)/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /givemoney.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	let userid = (params[1]);
	let cutid = userid.substr(15);
	vk.api.call("utils.resolveScreenName", {
		screen_name: cutid
	}).then(res => {
		users[res.object_id].balance += Number(params[2]);
		return message.reply(`Баланс успешно выдан!` + smiles);
	})
});

command(/^\/givebtc\s([^]+)\s([0-9]+)/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /givebtc.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	let userid = (params[1]);
	let cutid = userid.substr(15);
	vk.api.call("utils.resolveScreenName", {
		screen_name: cutid
	}).then(res => {
		users[res.object_id].btc += Number(params[2]);
		return message.reply(`Баланс успешно выдан!` + smiles);
	})
});

command(/^\/giveusd\s([^]+)\s([0-9]+)/i, 'none', function (message, params) {
		if(message.user != cfg.ownerid) {
			console.log(`Пользователь @` + message.user + ` запросил /giveusd.\nДоступ закрыт.`+ `\n`);
			return message.reply('Доступ запрещен ⛔');
		}
		let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
		let userid = (params[1]);
		let cutid = userid.substr(15);
		vk.api.call("utils.resolveScreenName", {
			screen_name: cutid
		}).then(res => {
			users[res.object_id].usd += Number(params[2]);
			return message.reply(`Баланс успешно выдан!` + smiles);
		})
});

command(/^\/uptime/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /uptime.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	let time = process.uptime();
	let uptime = (time + "").toHHMMSS();
	return message.reply(`Аптайм бота - ` + uptime + `⌚`);
});

command(/^\/kick\s([^]+)/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /kick.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	let userid = (params[1]);
	let cutid = userid.substr(15);
	vk.api.call("utils.resolveScreenName", {
		screen_name: cutid
	}).then(res => {
		vk.api.call("messages.removeChatUser", {
			chat_id: message.chat,
			user_id: res.object_id
		})
		return message.reply(`Пользователь успешно выгнан из беседы! ` + smiles);
	})
});

command(/^\/status\s([^]+)/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /status.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	let smiles = rand([`🍏`,`🌚`,`🌿`,`🍃`,`✨`,`💭`,`💬`,`⚕`,`💨`,`🐤`,`🍀`,`🐼`,`🥚`,`🎯`])
	vk.api.call("account.saveProfileInfo", {
		status: params[1]
	})
	return message.reply(`Статус успешно установлен! ` + smiles);
});

command(/^\/cfg/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /cfg.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	return message.reply(`🔮 Конфиг: \n\n` + 
	'autostatus:' + cfg.autostatus + '\n' +
	'autoaccept: ' + cfg.autoaccept + '\n' +
	'automoney: ' + cfg.automoney + '\n' +
	'startmoney: ' + cfg.startmoney + '\n' +
	'startbtc: ' + cfg.startbtc + '\n' +
	'startusd: ' + cfg.startusd + '\n' +
	'ownerid: ' + cfg.ownerid
	);
});

command(/^\/setcfg/i, 'none', function (message, params) {
	if(message.user != cfg.ownerid) {
		console.log(`Пользователь @` + message.user + ` запросил /setcfg.\nДоступ закрыт.`+ `\n`);
		return message.reply('Доступ запрещен ⛔');
	}
	cfg.params[1] = params[2]
	return message.reply(`Конфиг успешно изменен! 🔮`);
});

function imageFromUrl(url, cb) {
    const r = url[4] === "s" ? https : http;
    r.get(url).on("response", function(res) {
      let chunks = [];
      res.on("data", d => chunks.push(d));
      res.on("end", function() {
        let img = new Canvas.Image();
        img.src = Buffer.concat(chunks);
        cb(img);
      });
    });
}

function getRandomInt(min, max){return Math.round(Math.random() * (max - min)) + min}
Array.prototype.random = function(){return this[Math.floor(this.length * Math.random())];}