var Stream = require('stream').Stream;
var util = require('util');

function PerfmonStream(counters) {
	Stream.call(this);

	this.counters = counters;
	this.writable = true;
	this.readable = true;
	this._queue = [];
	this._paused = false;
}

util.inherits(PerfmonStream, Stream);

PerfmonStream.prototype.write = function(data) {
	var out = {};

	for (var i in data) {
		out[i] = data[i];
	}

	out.counters = {};

	this.counters.forEach(function(c) {
		out.counters[c] = data.counters[c];
	});

	if (this._paused) {
		this._queue.push(out);
	}
	else {
		this.emit('data', out);
	}
};

PerfmonStream.prototype.pause = function() {
	this._paused = true;
};

PerfmonStream.prototype.resume = function() {
	this._paused = false;

	while (this._queue.length) {
		this.write(this._queue.shift());
	}
};

module.exports = PerfmonStream;