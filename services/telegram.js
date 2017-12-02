var config = require('config');
var request = require('request');
var telegram_endpoint = "https://api.telegram.org/bot";
var telegram_apikey = config.get("messaging.telegram.apikey");
var telegram_admin = config.get("messaging.telegram.admin");

function pushMessage(msg, cb) {
	var title = msg.title;
	var message = msg.message;
	var telegram_push = telegram_endpoint + telegram_apikey + "/sendMessage?chat_id=" + telegram_admin + "&text=";
		request({url: telegram_push + title, rejectUnauthorized: false}, function(err, res, body) {
			if (err) {
				console.error(err);
				cb(err, null);
			} else {
				cb(null, body);
			}
	});
}

// {cmd: "send", context: {}}
serviceEvent.on('telegram', function(msg) {
	if (!msg.res && msg.cmd) {
		var res = msg;
		switch (msg.cmd) {
			case "send":
				pushMessage(msg.context, function(err, ret) {
					if (err) {
						console.error(err);
					} else {
						res.res = ret;
						serviceEvent.emit("telegram-" + msg.requestID, res);
					}
				});
				break;
			default:
			break;
		}
	}
});
