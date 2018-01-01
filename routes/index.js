var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/disks', function(ret, res, next) {
	var msg = {cmd: "df"};
	emitServiceEvent("disks", msg, true, function(ret) {
		res.json(ret.res);
	});
});

module.exports = router;
