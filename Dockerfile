FROM ubuntu:23.04

USER root
COPY . /schematization
WORKDIR /schematization

RUN apt update && apt install -y libgdal-dev python3-pip python3-mapnik python3-gdal python3-scipy
RUN pip3 install cython --break-system-packages
RUN pip3 install -r requirements.txt --break-system-packages

CMD python3 server.py