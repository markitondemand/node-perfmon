var os = require('os');
var TypePerf = require('./lib/TypePerf');
var PerfmonStream = require('./lib/PerfmonStream');

var hosts = {};
var hostname = os.hostname();

function shallowArrayEquals(a, b) {
	if (a.length != b.length) {
		return;
	}

	a.sort();
	b.sort();

	for (var i=0; i<a.length; i++) {
		if (a[i].toLowerCase() != b[i].toLowerCase()) {
			return;
		}
	}

	return true;
}

function stringOrArrayToArray(value) {
 	if (Array.isArray(value)) {
 		return value;
 	}

 	if (typeof(value) == 'string') {
 		return [value];
 	}

 	return false;
}

function attach(typeperf, pstream) {
	// piping assumes errors are fatal
	// they are ok if we're streaming multiple
	// hosts and only one child process fails
	// typeperf.pipe(pstream);

	typeperf.on('data', function(data) {
		pstream.write(data);
	});

	typeperf.on('error', function(err) {
		pstream.emit('error', err);
	});
}

function init(host, options, pstream) {
	var typeperf;

	if (!hosts[host]) {
		hosts[host] = new TypePerf(host);
	}

	typeperf = hosts[host];
	attach(typeperf, pstream);

	if (!shallowArrayEquals(options.counters, typeperf.counters())) {
		typeperf.counters(typeperf.counters().concat(options.counters));
		typeperf.spawn();
	}
	else if (!typeperf.cp) {
		typeperf.spawn();
	}
}

function each(host, cb) {
	if (!host) {
		// do em all
		for (var h in hosts) {
			cb(hosts[h]);
		}
	}
	else {
		if (!Array.isArray(host)) {
			host = [host];
		}

		host.forEach(function(h) {
			if (hosts[h]) {
				cb(hosts[h]);
			}
		});
	}	
}

function parseInputs(args) {
	// counters can be array or string
	// options is object
	// cb must be func
	// host can be array or string

	// if 0 is object, options == 0
		// cb is last arg fn or nothing
	// if 0 is string or array, counters = [0]
		// if 1 is string or array, hosts = [1]
		// cb is last arg fn or nothing

	var counters = stringOrArrayToArray(args[0]);
	var hosts = stringOrArrayToArray(args[1]);
	var cb = args[args.length - 1];
	var options = {};

	if (counters) {
		options = {
			counters: counters
		}

		if (hosts) {
			options.hosts = hosts;
		}

	}
	else if (typeof(args[0]) == 'object') {
		options = args[0];

		options.counters = stringOrArrayToArray(options.counters || options.counter);
		options.hosts = stringOrArrayToArray(options.hosts || options.host);
	}

	if (!options.counters) {
		options.error = 'perfmon invalid inputs';
	}

	if (!options.hosts) {
		options.hosts = [hostname];
	}

	return {
		options: options,
		cb: cb
	}
}

/*
public interface
acceptable inputs

perfmon(counters)
perfmon(counters, cb)
perfmon(counters, host, cb)
perfmon(options)
perfmon(options, cb)
*/

function perfmon() {
	var inputs = parseInputs(arguments);
	var pstream = new PerfmonStream();

	if (typeof(inputs.cb) == 'function') {
		pstream.on('data', function(data) {
			inputs.cb(null, data);
		});

		pstream.on('error', inputs.cb);
	}

	if (inputs.options.error) {
		process.nextTick(function() {
			pstream.emit('error', inputs.options.error);
		});
	}
	else {
		inputs.options.hosts.forEach(function(h) {
			init(h, inputs.options, pstream);
		});	
	}

	return pstream;
}

/*
acceptable inputs
perfmon.list(counterFamily, cb)
perfmon.list(counterFamily, hosts, cb)
*/

perfmon.list = function(counter, host, cb) {
	// arg parsing here too? not today.
	var pstream = new PerfmonStream();

	if (arguments.length == 2 && typeof(host) == 'function') {
		cb = host;
		host = null;
	}

	if (!host) {
		host = [os.hostname()];
	}

	host.forEach(function(host) {
		TypePerf.listCounters(counter, host, function(err, data) {
			if (err) {
				pstream.emit('error', err);
			}
			else {
				pstream.write(data);	
			}
		});
	});

	if (cb) {
		pstream.on('data', function(data) {
			cb(null, data);
		});
		pstream.on('error', cb);
	}

	return pstream;
};

perfmon.stop = function(host) {
	each(host, function(typeperf) {
		typeperf.kill();
	});
};

perfmon.start = function(host) {
	each(host, function(typeperf) {
		typeperf.spawn();
	});
};

module.exports = perfmon;