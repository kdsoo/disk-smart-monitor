var config = require('config');
var os = require('os');
var spawn = require('child_process').spawn;
var fs = require('fs');
var readline = require('readline');

var interval = parseInt(config.get("scanInterval")) * 60 * 60 * 1000;

var smartstat = {};

function examineCMD(cb) {
	var examine = spawn('sudo', ["smartctl"]);
	var isOk = true;
	examine.stderr.on('data', function(data) {
		console.log('smartctl err data: ' + data);
		isOk = false;
	});
	examine.stdout.on('data', function(data) {
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

function dfCMD(cb) {
	var df = spawn('df', ["-hT"]);
	var rl = readline.createInterface({input: df.stdout});
	var list = {};
	df.stderr.on('data', function(data) {
		//console.log(disk + ' smartctl err data: ' + data);
	});
	df.stdout.on('data', function(data) {
		//console.log(disk + ' smartctl out data: ' + data);
		//list += data;
	});
	rl.on('line', function(line) {
		var lineArr = line.split(" ").filter(Boolean);
		var dev = lineArr[0];
		var fstype = lineArr[1];
		var size = lineArr[2];
		var used = lineArr[3];
		var avail = lineArr[4];
		var ratio = lineArr[5];
		var mnt = lineArr[6];
		if (fstype !== "tmpfs" && fstype !== "devtmpfs" && fstype !== "Type") {
			//console.log(lineArr);
			//console.log(dev.split(/(\d+)/).filter(Boolean));
			var block = dev.split(/(\d+)/).filter(Boolean);
			var disk = {dev: dev, fstype: fstype, size: size, used: used, avail: avail, ratio: ratio, mnt: mnt};
			if (list[block[0]] == undefined) list[block[0]] = {};
			if (list[block[0]]["partitions"] == undefined) list[block[0]]["partitions"] = [];
			list[block[0]]["partitions"].push(disk);
		}
	});
	df.stdout.on('end', function() {
		//console.log(disk + " SMART done");
		cb(null, list);
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
								smartstat[disk] = "unhealthy";
							} else {
								smartstat[disk] = "healthy";
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

dfCMD(function(err, ret) {
	if (err) console.error(err);
	var keys = Object.keys(ret);
	for (var i = 0; i < keys.length; i++) {
		console.log(ret[keys[i]]);
	}
});

fullDiag();

setInterval(function() {
	fullDiag();
}, interval);

serviceEvent.on("disks", function(msg) {
	if (!msg.res && msg.cmd) {
		var res = msg;
		switch (msg.cmd) {
			case "df":
				dfCMD(function(err, ret) {
					if (err) console.error(err);
					var disks = Object.keys(ret);
					for (var i = 0; i < disks.length; i++) {
						ret[disks[i]].smart = smartstat[disks[i]];
					}
					res.res = ret;
					serviceEvent.emit("disks-" + msg.requestID, res);
				});
				break;
			default:
				console.error("mdns serviceEvent: " + msg.cmd + " is not supported event command");
			break;
		}
	}
});
