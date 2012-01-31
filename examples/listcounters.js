var perfmon = require('perfmon');

perfmon.list('processor', function(err, data) {
	console.warn(data);
});

perfmon.list('memory', function(err, data) {
	console.warn(data);
});

perfmon.list('logicaldisk', function(err, data) {
	console.warn(data);
});