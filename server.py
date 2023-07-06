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

def log(uid, lat, lng, c0, c1, c2, ignore_pp, fixed_width, turns, layout, margins, scale, draw_all_island, error=None, comment=None):
    xml = ""
    for file in shutil.os.listdir("static/cache/"+uid):
        if file.endswith('.xml'):
            xml = "static/cache/%s/%s"%(uid,file)
            break
    libraries = ""
    for lib in ["osmnx","crossroads-segmentation","crmodel", "crossroads-schematization"]:
        libraries += "%s %s\n"%(lib, version(lib))
    logfile = "DATE : %s\nPOSITION : %s %s\nC0 C1 C2 : %s %s %s\nignore_pp : %s\nfixed_width: %s\nturns: %s\nlayout: %s\nmargins: %s\nscale: %s\ndraw_all_island: %s\nIBRARIES : \n%s"%(datetime.now().strftime("%d/%m/%Y %H:%M:%S"), lat, lng, c0, c1, c2, ignore_pp, fixed_width, turns, layout, margins, scale, draw_all_island, libraries)
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
    if c0 is None:
        c0 = 2
    if c1 is None:
        c1 = 2
    if c2 is None:
        c2 = 4

    turns, ignore_pp, fixed_width, layout = args.get("turns"), args.get("ignore_pp"), args.get("fixed_width"), args.get("layout")
    ignore_pp = ignore_pp == "true"
    fixed_width = fixed_width == "true"
    margins = args.get("margins")
    scale = args.get("scale")
    draw_all_island = args.get("draw_all_island") == "true"


    if lat and lng and uid:
        result, directory = generate_schematization_if_required(uid, float(lat), float(lng), float(c0), float(c1), float(c2), 
                bool(ignore_pp), bool(fixed_width), str(turns), bool(draw_all_island), str(layout), float(margins), int(scale), app.logger)
        log(uid, lat, lng, c0, c1, c2, ignore_pp, fixed_width, turns, layout, margins, scale, draw_all_island, result, comment)
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
        return json.dumps({"error": str(e)})

    if directory != "":
        try:
            result = {
                "tif-96": url_prefix + directory + "/" + "schematization-96.tif",
                "pdf-300": url_prefix + directory + "/" + "schematization-300.pdf"
            }
            return json.dumps(result)
        except Exception as e:
            app.logger.info("cannot send file (exception: %s)", str(e))
            return json.dumps({"error": str(e)})
    else:
        app.logger.info("fichier manquant")
        return "fichier manquant"


if __name__ == '__main__':
    app.run(debug=True, use_reloader=False, host='0.0.0.0', port=int(shutil.os.environ.get("PORT", 8080)))