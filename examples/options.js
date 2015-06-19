var perfmon = require('../perfmon');

var counters = [
	'\\processor(_total)\\% processor time',
	'\\Memory\\Available bytes'
];

perfmon({counters:counters, sampleInterval:5, sampleCount:5}, function(err, data) {
	var date = new Date(data.time);
	// display in format HH:MM:SS	
	data.time = twoDigits(date.getHours()) 
      + ':' + twoDigits(date.getMinutes()) 
      + ':' + twoDigits(date.getSeconds());
	console.log(data);
});

function twoDigits(value) {
   if(value < 10) {
    return '0' + value;
   }
   return value;
}