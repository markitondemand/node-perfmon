var perfmon = require('perfmon');
var cpu = '\\processor(_total)\\% processor time';

perfmon(cpu, 'someothermachine.local', function(err, data) {
	console.log(err || data);	
});