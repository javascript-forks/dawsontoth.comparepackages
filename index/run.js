var fs = require('fs'),
	args = require('optimist')
		.usage('Usage: $0 -a /path/to/app')

		.options('a', {
			default: process.cwd(),
			string: true,
			alias: 'app',
			describe: 'Your app\'s root directory.'
		})
		.options('t', {
			default: '',
			string: true,
			alias: 'to',
			describe: 'Compare against the specified JSON for differences.'
		})
		.argv
	;

function exit(message) {
	if (message !== 0) {
		console.error(message);
		process.exit(1);
	}
	else {
		process.exit(0);
	}
}

var results = {},
	resources = requireFS(args);
walk(results, resources, walked);
function walked(err) {
	if (err) {
		return exit(err);
	}
	var from = {},
		fromKeys = Object.keys(results).sort();
	for (var i = 0, iL = fromKeys.length; i < iL; i++) {
		from[fromKeys[i]] = results[fromKeys[i]];
	}
	if (args.to) {
		var to = JSON.parse(args.to),
			toKeys = Object.keys(to).sort();

		var uniqueToApp = [],
			missingFromApp = [],
			differentVersions = [];

		// Calculate unique to app.
		for (var j = 0, jL = fromKeys.length; j < jL; j++) {
			if (!to[fromKeys[j]]) {
				uniqueToApp.push(fromKeys[j]);
			}
		}
		if (uniqueToApp.length) {
			console.log('');
			console.log('Modules unique to this app:');
			console.log(uniqueToApp);
		}

		// Calculate missing from app.
		for (var k = 0, kL = toKeys.length; k < kL; k++) {
			if (!from[toKeys[k]]) {
				missingFromApp.push(toKeys[k]);
			}
		}
		if (missingFromApp.length) {
			console.log('');
			console.log('Modules this app is missing:');
			console.log(missingFromApp);
		}

		// Calculate different versions.
		for (var l = 0, lL = fromKeys.length; l < lL; l++) {
			var toVersions = to[fromKeys[l]],
				fromVersions = from[fromKeys[l]];
			if (toVersions && fromVersions) {
				for (var m = 0, mL = toVersions.length; m < mL; m++) {
					if (fromVersions.indexOf(toVersions[m]) === -1) {
						differentVersions.push(fromKeys[l] + '@' + toVersions[m]);
					}
				}
				for (var n = 0, nL = fromVersions.length; n < nL; n++) {
					if (toVersions.indexOf(fromVersions[n]) === -1) {
						differentVersions.push(fromKeys[l] + '@' + fromVersions[n]);
					}
				}
			}
		}
		if (differentVersions.length) {
			console.log('');
			console.log('Different versions:');
			console.log(differentVersions);
		}

		// Finish up.
		if (!uniqueToApp.length && !missingFromApp.length && !differentVersions.length) {
			console.log('');
			console.log('All modules are the same.');
		}
		console.log('');
	}
	else {
		console.log("comparepackages -t '" + JSON.stringify(from) + "'");
	}
}

/**
 * Makes sure a directory exists. Accepts 2 or more args, where the 2nd and on are path.joined together.
 * @param args
 * @return {*}
 */
function requireFS(args) {
	var app = args.app;
	var pathParts = Array.prototype.slice.call(arguments, 1);
	var original = pathParts.join('/');
	pathParts.unshift(app);
	var path = pathParts.join('/');
	if (!fs.existsSync(path)) {
		return exit(original + ' not found.');
	}
	else {
		return path;
	}
}

function walk(results, dir, done) {
	fs.readdir(dir, function(err, list) {
		if (err) {
			return done(err);
		}
		var pending = list.length;
		if (!pending) {
			return done();
		}

		function checkDone() {
			if (!--pending) {
				done();
			}
		}

		list.forEach(function(file) {
			file = dir + '/' + file;
			fs.stat(file, function(err, stat) {
				if (stat && stat.isDirectory()) {
					walk(results, file, function(err, res) {
						checkDone();
					});
				} else {
					if (/package\.json$/.test(file)) {
						fs.readFile(file, function(err, data) {
							var contents = JSON.parse(data.toString());
							if (!results[contents.name]) {
								results[contents.name] = [];
							}
							if (results[contents.name].indexOf(contents.version) === -1) {
								results[contents.name].push(contents.version);
								results[contents.name].sort();
							}
							checkDone();
						});
					}
					else {
						checkDone();
					}
				}
			});
		});
	});
}