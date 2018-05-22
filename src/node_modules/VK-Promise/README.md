# VK-Promise

Модуль для работы с ВКонтакте API и Callback API ВКонтакте.

## Установка

`npm install VK-Promise`

## Tl;dr
```js
var VK = require("VK-Promise"),
    vk = new VK("сюда access_token");
// запрос
vk(/*string*/ метод, /*object*/ данные)
    .then(/*function*/ on_response)
    .catch(/*function*/ on_error);
// Загрузка файла
vk.upload(
    /*string*/ метод_получения_сервера,
    /*string*/ метод_сохранения_файла,
    {
        get: {/* данные передаваемые методу получения сервера*/},
        save: {/* данные передаваемые методу сохранения файла*/},
        files: {/* файлы */
            file1: /*string*/ путь_к_файлу,
            file2: stream /* необходимо указать stream.filename */,
            file3: {filename: имя_файла, buffer: Buffer},
        }
    }
);
// Получение всего что у чего есть offset
vk.getAll(/*string*/ метод_получения_данных, /*object*/ данные, /*function*/ отслеживание_прогресса)
// Функции
vk.longpoll.start(/*object*/ options); // Запуск получения сообщения через LongPoll
vk.init_execute_cart(/*number*/ интервал_запросов_50_для_групп_или_334); // Запуск пакетной обработки запросов через execute
vk.init_callback_api(); // Получения обработчика для http.createServer
// Разное
VK.getAttachmentUrl(/*object*/ массив_или_объект_вложений, /*string*/ тип_добавляемы_массиву_вложений); // Получения url из msg.attachments
VK.Array2Object(/*Array*/ array); // [{key:key,value:value}] => {key:value}
// Авторизация
vk.auth({username: "логин", password: "пароль"})
  .then(vk.users.get)
  .then(console.log, console.error);
```

## Элементарный запрос
```js
vk.users.get({
    user_id: 1 // данные передаваемые API
}).then(function (res) {
    console.log("response",res);
}).catch(function (error) {
    console.log("Ошибка",error);
});
```

## Элементарный бот
```js
vk.longpoll.start(); // Запускаем получение сообщений через LongPoll

vk.on("message",function (event, msg) { // Обрабатываем сообщения
    if(msg.body == "ping") // Если текст сообщения равен ping
        msg.send("pong"); // Отвечаем pong
});
```

## Обработка need_captcha
```js
vk.on("captcha",function(event, data){
	console.log("Ссылка на код:", data.captcha_img);
    data.submit("Вводим код с картинки");
});
// API метод вызова captcha
vk("captcha.force",{})
```

## Элементарный бот для группы через Callback API с оптимизацией ответа на сообщения через execute
```js
var http = require("http");

// Запускаем http сервер на 80 порту с обработкой Callback API
// PS: Сервер в настройках группы нужно вешать вручную  
var callback = vk.init_callback_api("Строка, которую должен вернуть сервер", "secretkey", {group: 123});
http.createServer(function (req, res) {
    if(req.url == "/vk_callback_api") // фильтруем по url
        return callback(req, res);
    // Далее делаем все что нам нужно
    res.end("Error 404");
}).listen(80);

// Включаем оптимизацию через execute
// Собирает все запросы и выполняет пачками раз в 334мс
// 334мс - 3 раза в секунду, стандартное ограничение для юзеров
// Для групп указываем 50
vk.init_execute_cart(50);

// message_new & message_reply объединяет в message
vk.on("message",function (event, msg) {
    msg.send("OK");
    event.ok(); // Отвечаем callback api серверу OK
});

// все остальное идет в callback type
// Например если участник вышел из сообщества
vk.on("group_leave",function (event, data) {
    console.log("info", data.$);
    if(data.self) // если сам вышел
        vk.messages.send({ // Отправляем сообщени
            message:"Ну куда же ты :_(", // текст сообщения
            peer_id: data.object.user_id // Кому
        });
    event.ok();
});
```
## Загрузка файлов
```js
// http
http.get("https://fs.flyink.ru/1.png",function(stream){
    stream.filename = "filename.png";
    vk.upload(
        "docs.getUploadServer",
        "docs.save",{
            files: {file: stream}
        }
    ).then(function (r) {
        console.log("response",r)
    }, console.error);
});

// https
vk.request("https://vk.com/doc-131495752_441571967?api=1")
    .then(vk.upload.photos)
    .then(console.log, console.error);

// С диска
var fs = require("fs");

vk.upload.doc(fs.createReadStream("/home/user1/test.png"))
    .then(console.log, console.error);

```
## Загрузка всей стены
```js
var readline = require('readline');

vk.getAll("wall.get",{owner_id: -2158488, count: 100},function (progress) {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    process.stdout.write("Загружено: "+ progress.offset + " из " +progress.count);
}).then(function (res) {
    readline.clearLine(process.stdout, 0)
    readline.cursorTo(process.stdout, 0)
    console.log("Загружено записей:",res.length);
}, console.error);
```

## Остановка LongPoll с последующим восстановлением
```js
vk.longpoll.start();

vk.longpoll.stop().then(function(data){
    setTimeout(function () {
        vk.longpoll.listen(data);
    }, 10000);
});
```

## Дополнительные данные
- vk
    - retry: false - Отключение повтора запроса при 6й ошибке:  (true)
    - ignore_cart: true - Игнорирование очереди запросов (false)
    - ignore_execute_cart: true - Игнорирование сборщика запросов (false)
    - reject_captcha: true - Выкидывать ошибку при проверочном коде (false)
    - headers - заголовки
- vk.getAll
    - max_offset - максимальный offset

## Что нового
0.2.91
- Исправлена функция msg.editChat
- Добавлены функции vk.upload.widgetsAppImage и vk.upload.widgetsGroupImage
- В vk.init_callback_api  добавлен аргумент data (key, secret, data) для передачи к событиям data.$
- Новое событие confirmation, для CallBack API

0.2.8
- vk.longpoll.stop возвращает Promise

0.2.7
- исправления в msg.get
- Добавил msg.user_id, msg.source_text, source_old_text с LongPoll
- vk.longpoll.listen - функция прослушки LongPoll сервера
- VK.default_options.longpoll - хранит стандартные параметры LongPoll
- callback vk.longpoll.stop теперь отдает данные для восстановления через vk.longpoll.listen

0.2.6
- msg.setActivity теперь принимает type
- Исправления msg.setActivity и msg.delete
- Добавлен метод messages.pin
- Из запросов идущих через сбор запросов убирается lang, если равно текущей и reject_captcha
- Починил return в msg.get

0.2.5
- Исправления в документации
- vk.longpoll.start
- vk.longpoll.stop
- Испрвлен метод VK.getAttachmentUrl

0.2.4
- Функция vk.longpoll.start получила опции которые передаются в messages.getLongPollServer
- В vk.longpoll.start изменены опции mode: 234, version: 1, что позволяет получать события о закреплении сообщений
- Исправлена очепятка unsupported
- Обновлена версия API до 5.69
- В vk.upload добавлена вожможность вывода ответа без сохранения, для вывода ответа после загрузаки используйте метод для сохранения "return"
- Исправленна функция vk.upload.chatPhoto
- VK.parseAttachments может принимать вторым параметром тип вложения
- msg теперь класс, в будущем все на него перепишу.
- msg.sendAttachment, msg.pin, msg.unpin, msg.addChatUser, msg.removeChatUser итд
- msg.body_decoded убрано, ищите в msg.data[6]
- vk.init_execute_cart теперь принемает интервал таймера и сразу его запускает
- Из запросов идущих через сбор запросов убирается версия api, если она равна текущей
- msg.send возвращает Promise с функциями edit и pin, для редактирования сообщения после отправки или пина
- Новое событие LongPollStop вызываемое ручной при остановке лонгполла

0.2.3
- Изменены события upload.get_server, upload.part, upload.end, upload.save
- Добавлено save_method "return", для методов не требующих сохранения
- Добавлены методы секции stories
- Методы для загрузки историй: vk.upload.storiesPhoto, vk.upload.storiesVideo
- reject_captcha: true - Выкидывать ошибку при проверочном коде


0.2.2
- Убран модуль fs, поэтому если вы использовали msg.sendPhoto или msg.sendDoc для загрузки с диска, то используйте fs.createReadStream
- Исправлена ошибка vk.request
- Новый раздел документации (ниже)

0.2.1
- Исправлен вывод ошибок в vk.upload
- vk.auth, пока без капч и 2фа
- Небольшие исправления

0.1.9
- Улучшена секция vk.upload
- Изменения в vk.request:
    - Если передать url и data, то по умолчанию будет GET запрос и data вложится в search
    - Добавлена обработка 302 ошибки
    - При statusCode !== 200 запрос уйдет в catch
- VK.available_methods вынесен в available_methods.json
- Добавлен параметр стандартного имени файла options.filename
- Правки в VK.getAttachmentUrl и VK.parseAttachments

0.1.8
- Переписан build_execute_request

## Разное
- VK - функция создания vk
    - default_options - Стандартные параметры
        - filename - стандартное имя файла для загрузки
        - cart_interval - интервал выполнения запросов
        - host - хост api
        - method - метод передачи данных
        - body - вложения в запрос
            - v - версия api
        - заголовки для запросов
            - user-agent - id
    - available_methods - Доступные методы
    - Array2Object - переводит [{"value": "value1", "key": "key2"}] в {"key1": "value1"}
    - parseAttachments - Переводит вложения в их id
    - getAttachmentUrl - Получает ссылку на вложение
- vk - функция запросов к api
    - listeners - список функций для vk.on
    - on - получение событий
        - * - все события
        - update - события с longpoll
        - messages - сообщения
        - error - ошибки
        - captcha - капча
        - LongPollError - ошибка longpoll сервера
        - LongPollRequest - запрос longpoll сервера
        - LongPollResponse - ответ longpoll сервера
        - response - ответ api
        - get_server_method - ответ vk.upload при получении сервера загрузки
        - upload_end - окончание загрузки файлов vk.upload
        - part_upload - начало загрузки файла в vk.upload
        - part_end - завершение загрузки файла в vk.upload
        - и типы событий callback api
    - init_longpoll - старый аналог vk.longpoll.start
    - vk.longpoll - секция для работы с longpoll
        - start - функция включение получения сообщений через longpoll
        - stop - функция остановки longpoll
        - listen - функция прослушивания сервера
        - exit - переменная для выхода из цикла longpoll
    - attach_message_functions - подключение функций для ответа к объекту сообщения
    - init_callback_api - получение функции для обработки запросов callback api
    - cart - объект очереди запросов
        - timer - таймер для обработки запросов
        - execute_cart - использовать ли build_execute_request
        - init - функция включения очереди запросов
        - deinit - функция отключения очереди запросов
    - build_execute_request - сборщик запросов в execute
    - init_execute_cart - функция включения build_execute_request
    - getAll - функция получения всего через offset
    - upload - функция загрузки     
        - photos = photo - фото
    	- wallPhotos = wallPhoto - фото на стену
    	- ownerPhoto - фото в профиль
    	- messagesPhoto - фото в сообщение
    	- chatPhoto - фото на аватарку беседы
    	- marketPhoto - фото в товар
    	- marketAlbumPhoto - фото на альбом товаров
    	- audio - аудио
    	- video - видео
    	- docs = doc - документ
    	- wallDocs = wallDoc - документ на стену
    	- groupCover - обложка группы
    - request - функция запросов
    - tryJSON - функция парсинга json
    - options - объект параметров
    - auth - авторизация
- msg - объект сообщения
    - data - данные с longpoll
    - send - отправить сообщение
        - edit - отредактировать отправленное сообщение
        - pin - закрепить
    - send - отправить сообщение
    - reply - ответить на сообщение
    - sendSticker - отправить стикер
    - sendPhoto - отправить фото
    - sendDoc - отправить документ
    - sendGraffiti - отправить граффити
    - sendAudioMessage - отправить голосовое сообщение
    - get - получить данные которые не выдает longpoll
    - setActivity - послать статус тайпинга
    - deleteDialog - удалить диалог
    - delete - удалить сообщение
    - restore - восстановить сообщение или пометить как спам
    - markAsRead - прочитать сообщение
    - markAsImportant - отметить важным
    - markAsAnsweredDialog - отметить отвеченным
    - editChat - изменяет название беседы
    - getChatUsers - получить участников беседы
    - getChat - получить информацию о беседе
    - addChatUser - добавить в беседе
    - removeChatUser - удалить и беседе
    - edit - отредактировать сообщение
    - pin - закрепить сообщение
    - sendAttachment - отправить сообщение с вложением
    - getInviteLink - получить ссылку на беседу
