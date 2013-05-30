# Compare Packages
Crawls all package.json in a Node project, and dumps a key to version dictionary.

# Installation

    npm install -g comparepackages

# How To Use

    $ comparepackages -a /path/to/first/node/app
    > comparepackages -t '{"comparepackages":["1.0.0"],"optimist":["0.5.1"],"wordwrap":["0.0.2"]}'

    $ comparepackages -a /path/to/second/node/app -t '{"comparepackages":["1.0.0"],"optimist":["0.5.1"],"wordwrap":["0.0.2"]}'
    > All modules are the same.

If you don't specify "-a", the current directory will be used instead.