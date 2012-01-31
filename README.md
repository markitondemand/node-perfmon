perfmon
=============

Streaming [Performance Monitor](http://technet.microsoft.com/en-us/library/cc749249.aspx) metrics for [Node](http://nodejs.org) on Windows.

It's just a wrapper around [typeperf](http://technet.microsoft.com/en-us/library/bb490960.aspx), and provides a Node [ReadableStream](http://nodejs.org/docs/latest/api/streams.html#readable_Stream) interface.  Metrics are streamed once per second.  `perfmon` wraps up the typeperf executable as a child_process. It ensures that no more than one process will be spawned for each host machine streaming metrics.

# Dependenices

Node, Windows, and the typeperf executable in your path.  I've never seen a Windows installation that didn't have it, but it's not out of the realm of possibility.  Windows For Workgroups 3.11 had it. For realz.

Only the machine running Node needs Node. Makes perfect sense.  Streaming metrics from remote machines only requires that they are running Windows.

# Install


	npm install perfmon

and then require it

	var perfmon = require('perfmon');

# Usage

The most basic usage is to stream a single metric from the local machine.  The `perfmon` function returns an instance of a ReadableStream.  You can either pass a callback as the last argument to `perfmon`, or attach to the `data` and `error` events on the returned Stream.

The first two arguments to `perfmon`, *counters* and *hosts*, can be strings or arrays.  *hosts* is optional and assumed to be local machine if not specified.

	perfmon('\\processor(_total)\\% processor time', function(err, data) {
		console.log(data);
	});


## List available metric counters

Use `list` to return a, um, list of available counters.


	perfmon.list('memory', function(err, data) {
		console.log(data);
	});


## Stream remote host metrics

You can connect to any machine on your network (assuming you have appropriate permissions, more on that in the future), and stream metrics from that machine. 

	var counters = [
		'\\processor(_total)\\% processor time',
		'\\memory\\available bytes',
	];

	perfmon(counters, 'somecomputer.somewhere.local', function(err, data) {
		console.log(data);
	});
