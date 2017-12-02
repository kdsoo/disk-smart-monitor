var config = require('config');
var os = require('os');
var spawn = require('child_process').spawn;
var fs = require('fs');
var readline = require('readline');

var interval = parseInt(config.get("scanInterval")) * 60 * 60 * 1000;

function examineCMD(cb) {
	var examine = spawn('sudo', ["smartctl"]);
	var isOk = true;
	examine.stderr.on('data', function(data) {
		console.log('smartctl err data: ' + data);
		isOk = false;
	});
	examine.stdout.on('data', function(data) {
		log += data;
	});
	examine.stdout.on('end', function() {
		cb(isOk);
	});
}

function getBlkList(cb) {
	fs.readdir("/sys/block", function(err, ret) {
		if (err) {
			cb(err, null);
		} else {
			var list = [];
			for (var i = 0; i < ret.length; i++) {
				if ((ret[i].match(/loop/g) == null) && (ret[i].match(/ram/g) == null))
					list.push("/dev/" + ret[i]);
			}
			cb(null, list);
		}
	});
}

function examineSMART(disk, cb) {
	var examine = spawn('sudo', ["/usr/sbin/smartctl", "-H", disk]);
	var rl = readline.createInterface({input: examine.stdout});
	var passed = false;
	var log = "";
	examine.stderr.on('data', function(data) {
		//console.log(disk + ' smartctl err data: ' + data);
	});
	examine.stdout.on('data', function(data) {
		//console.log(disk + ' smartctl out data: ' + data);
		log += data;
	});
	rl.on('line', function(line) {
		var lineArr = line.split(" ").filter(Boolean);
		//console.log(disk, lineArr);
		if (lineArr.indexOf("PASSED") > -1) {
			passed = true;
		}
	});
	examine.stdout.on('end', function() {
		//console.log(disk + " SMART done");
		cb(null, passed, log);
	});
}

function fullDiag() {
	getBlkList(function(err, ret) {
		if (err) {
			console.error(err);
			cb(err, null);
		} else {
			for (var i = 0; i < ret.length; i++) {
				(function(i) {
					var disk = ret[i];
					examineSMART(disk, function(err, res, log) {
						if (err) {
							console.error("examineSMART on " + disk + " got err: " + err);
						} else {
							if (res == false) {
								console.log(disk + " disk health check failed");
								console.log(log);
								var msg = {cmd: "send", context: {title: os.hostname() + " " + disk + " failure",
									message: log}};
								emitServiceEvent("pushbullet", msg, true, function(ret) {
									console.log(ret);
								});
								emitServiceEvent("telegram", msg, true, function(ret) {
									console.log(ret);
								});
							} else {
								console.log(disk + " is ok");
							}
						}
					});
				})(i);
			}
		}
	});
}

examineCMD(function(ret) {
	if (ret == false) {
		console.error("Please install smartctl first");
		process.exit();
	}
});

fullDiag();

setInterval(function() {
	fullDiag();
}, interval);
