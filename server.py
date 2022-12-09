#!/usr/bin/env python3

import shutil
from datetime import datetime
from importlib.metadata import version
import random
import string
import json
import traceback
from schematization import *
from flask import Flask, request, send_file

def log(uid, lat, lng, c0, c1, c2, error=None, comment=None):
    xml = ""
    for file in shutil.os.listdir("static/cache/"+uid):
        if file.endswith('.xml'):
            xml = "static/cache/%s/%s"%(uid,file)
            break
    libraries = ""
    for lib in ["osmnx","crossroads-segmentation","crmodel", "crdesc", "crossroads-schematization"]:
        libraries += "%s %s\n"%(lib, version(lib))
    logfile = "DATE : %s\nPOSITION : %s %s\nC0 C1 C2 : %s %s %s\nLIBRARIES : \n%s"%(datetime.now().strftime("%d/%m/%Y %H:%M:%S"), lat, lng, c0, c1, c2, libraries)
    if comment:
        logfile += "COMMENT : \n%s\n"%comment
    if error:
        logfile += "ERROR : \n%s"%error
    if xml:
        with open(xml, 'r') as f:
            content = f.read()
            logfile += "OSMXML CONTENT : \n%s"%content

    fname = ("error_%s%s.log" if error else "%s%s.log")%(''.join(random.choice(string.ascii_letters) for i in range(10)), datetime.now().timestamp())
    with open("log/"+fname, 'w') as f:
        f.write(logfile)


# clear folders
shutil.rmtree("static/cache", ignore_errors=True), shutil.os.mkdir("static/cache") , shutil.os.makedirs("log", exist_ok=True)

app = Flask(__name__)

@app.route("/")
def html():
    return app.send_static_file('index.html')

def build_schematization():
    args = request.args
    lat, lng, c0, c1, c2, uid, comment = args.get("lat"), args.get("lng"), args.get("c0"), args.get("c1"), args.get("c2"), args.get("uid"), args.get("comment")

    if c0 is None or c1 is None or c2 is None:
        c0 = 2
        c1 = 2
        c2 = 4

    if lat and lng and uid:
        result, directory = generate_schematization_if_required(uid, float(lat), float(lng), float(c0), float(c1), float(c2), app.logger)
        log(uid, lat, lng, c0, c1, c2, result, comment)
        return directory
    else:
        return ""

@app.route("/schematization")
def send_schematization():
    url_prefix = "/"
    try:        
        directory = build_schematization()
    except  Exception as e:
        app.logger.info("cannot build schematization (exception: %s)", str(e))
        return str(e)

    if directory != "":
        try:
            result = {
                "tif": url_prefix + directory + "/" + "schematization.tif",
                "pdf": url_prefix + directory + "/" + "schematization.pdf"
            }
            return json.dumps(result)
        except Exception as e:
            app.logger.info("cannot send file (exception: %s)", str(e))
            return str(e)
    else:
        app.logger.info("fichier manquant")
        return "fichier manquant"


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(shutil.os.environ.get("PORT", 8080)))