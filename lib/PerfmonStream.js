var Stream = require('stream').Stream;
var util = require('util');

function PerfmonStream() {
	Stream.call(this);	
	this.writable = true;
	this.readable = true;

	this._queue = [];
	this._paused = false;
}

util.inherits(PerfmonStream, Stream);

PerfmonStream.prototype.write = function(data) {
	if (this._paused) {
		this._queue.push(data);
	}
	else {
		this.emit('data', data);
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