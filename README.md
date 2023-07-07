# Crossroad-schematization web

This tool is an interactive web interface for [crossroad-schematization](https://github.com/jmtrivial/crossroads-schematization/), a python software that generates maps for blind people.

## Howto install


Building the docker image:

* Build the image with: ```docker build -t crschem .```
* Run the container with: ```docker run -dp 127.0.0.1:8888:8080 crschem```

Using an existing image available on [docker hub](https://hub.docker.com/):

* ```docker pull jmfavreau/crschem-web:latest```
* ```docker run -dp 127.0.0.1:8888:8080 jmfavreau/crschem-web```

The application is now available on your browser at the following address: ```localhost:8888``` 

## Demo instance

A demo instance of this tool is available at the following address without stability garantee: https://crschem.jmfavreau.info/