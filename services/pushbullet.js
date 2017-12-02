var config = require('config');
var PushBullet = require('pushbullet');
var apiKey = config.get("messaging.pushbullet.apikey");
var pushbullet = new PushBullet(apiKey);
var allDevices = '';

function getPushDevices(cb) {
	pushbullet.devices(function(error, response) {
		if (error) {
			cb(error, null);
		} else {
			response.devices.forEach(function(d, i) {
				console.log("pushbullet registered devices: " + d.nickname);
			});
			allDevices = response.devices;
			cb(null, response);
		}
	});
}

function pushMessage(msg, cb) {
	var title = msg.title;
	var message = msg.message;
	pushbullet.note(allDevices, title, message, function(error, response) {
		if (error) {
			console.error('error: ' + error);
			cb(error, null);
		} else {
			console.log('res: ' + JSON.stringify(response));
			cb(null, response);
		}
	});
}

getPushDevices(function(err, ret) {
	console.log("Get clients to be notified done");
});

// {cmd: "send", context: {}}
serviceEvent.on('pushbullet', function(msg) {
	if (!msg.res && msg.cmd) {
		var res = msg;
		switch (msg.cmd) {
			case "send":
				pushMessage(msg.context, function(err, ret) {
					if (err) {
						console.error(err);
					} else {
						res.res = ret;
						serviceEvent.emit("pushbullet-" + msg.requestID, res);
					}
				});
				break;
			default:
			break;
		}
	}
});
