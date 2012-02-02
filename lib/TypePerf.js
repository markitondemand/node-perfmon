var Stream = require('stream').Stream;
var spawn = require('child_process').spawn;
var util = require('util');
var os = require('os');

function TypePerf(host, counters) {
	Stream.call(this);

	this.host = host;
	this.cp;
	this._counters = [];
	this.readable = true;

	this.counters(counters);
}

util.inherits(TypePerf, Stream);

TypePerf.listCounters = function(name, host, callback) {
	var stdoutBuffer = '';
	var err;
	var data = {
		counters: []
	};

	name = name || '';
	data.host = host;

	var cp = spawn('TypePerf', ['-qx', name, '-s', host]);
	var parseLine = function(line) {
		if (line.indexOf('Error:') == 0) {
			// typeperf emits this regardless of whether or not the object wasn't found
			// or the remote machine doesn't exist.
			err = { 
				host: host, 
				message: 'The specified object was not found on the computer.'
			};
		}
		else if (line.indexOf('\\\\') != 0) {
			return;	
		}

		line = line.substr(host.length+3);
		data.counters.push(line);
	}

	cp.stdout.on('data', function(data) {
		var lines;

		data = stdoutBuffer + data.toString('utf8');
		lines = data.split('\r\n');
		stdoutBuffer = lines.pop();

		lines.forEach(parseLine);
	});

	cp.stderr.on('data', function(data) {
		err = data.toString('utf8');
	});

	cp.on('exit', function() {
		callback(err, data);
	});
};

TypePerf.prototype.counters = function(counters) {
	var self = this;

	if (!counters) {
		return self._counters;
	}

	self._counters = [];
	if (!Array.isArray(counters)) {
		counters = [counters];
	}

	// make it unique
	counters.forEach(function(counter) {
		if (self._counters.indexOf(counter) == -1) {
			self._counters.push(counter);
		}
	});

	return self._counters;
};

TypePerf.prototype.spawn = function() {
	var self = this;
	var runningProcess = this.cp;
	var stdoutBuffer = '';

	var cp = spawn('TypePerf', this._counters.concat([
		'-s',
		this.host
	]));

	function killRunningProcess() {
		if (runningProcess) {
			self.kill(runningProcess);
			runningProcess = null;	
		}
		self.cp = cp;
	}

	function update(line) {
		if (!line.length || !line[0] || line[0].indexOf('(PDH-CSV') == 0 || line[0].indexOf('Exiting') == 0) {
			return;
		}

		if (line[0].indexOf('Error: ') == 0) {
			self.emit('error', {
				host: self.host,
				message: line[0].replace(/^Error\:\s/, '')
			});

			self.kill(cp);

			// stop iterating over lines
			return true;
		}

		killRunningProcess(cp);

		var update = {
			host: self.host,
			time: new Date(line[0]).getTime(),
			counters: {}
		}
			
		self._counters.forEach(function(counter, idx) {
			// do we care about decimals?
			update.counters[counter] = (line[idx+1] !== undefined) ? Math.floor(line[idx+1]*1) : null;
		});

		self.emit('data', update);
	}

	cp.stdout.on('data', function(data) {
		data = stdoutBuffer + data.toString('utf8');

		var lines = data.split('\r\n');
		stdoutBuffer = lines.pop();

		lines.some(function(line) {
			line = line.replace(/"/g, '').split(',');
			return update(line);
		});
	});

	// never seen anything sent to stderr, unless you try and run this on non windows
	cp.stderr.on('data', function(data) {
		self.emit('error', {
			host: self.host,
			message: data.toString('utf8')
		});
	});

	cp.on('exit', function(code) {
		cp.removeAllListeners();
		// do we auto respawn?
		// console.warn('exitcode',code);
	});
};

TypePerf.prototype.kill = function(cp) {
	cp = cp || this.cp;

	if (!cp) return;

	cp.removeAllListeners();
	cp.kill();
};

module.exports = TypePerf;