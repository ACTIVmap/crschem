import os
import shutil

def generate_schematization_if_required(uid, latitude : float, longitude : float, c0: float, c1: float, c2 : float, logger):  
    import crschem.crossroad_schematization as cs

    cache_dir = "static/cache/"
    uid_path = cache_dir + str(uid)
    run_path = uid_path + "/" + str(latitude) + "-" + str(longitude) + "-" + str(c0) + "-" + str(c1) + "-" + str(c2)

    # only generate results if the run directory does not exist
    if not os.path.isdir(run_path):
        shutil.rmtree(uid_path, ignore_errors=True)
        shutil.os.mkdir(uid_path)
        shutil.os.mkdir(run_path)

        logger.info("PREPARE CrossroadSchematization lat: %s, long: %s", latitude, longitude)
        crschem = cs.CrossroadSchematization.build(latitude, longitude,
                                                   c0, c1, c2,
                                                   verbose=True)
        logger.info("PROCESS CrossroadSchematization")
        crschem.process()
        
        #crschem.toPdf(run_path + "/" + "schematization.pdf")
        
        crschem.toTif(run_path + "/" + "schematization.tif")

        result = "successful export"
    else:
        logger.info("dossier %s déjà présent", run_path)
        result = "already exists"

    return result, run_path
