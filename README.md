node-perfmon
=============

Streaming [perfmon](http://technet.microsoft.com/en-us/library/cc749249.aspx) metrics for Node on Windows.  It's really just a wrapper around [typeperf](http://technet.microsoft.com/en-us/library/bb490960.aspx), and provides a Node Readable stream interface into the data.

# Install

Not yet published to npm...

```
git clone https://github.com/markitondemand/node-perfmon
```

# Usage

```
var perfmon = require('perfmon');

perfmon('\\processor(_total)\\% processor time', function(err, data) {
    console.log(data);
});
```

## List available metric counters

## Stream remote host metrics

# Todo