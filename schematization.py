import os
import shutil

def generate_schematization_if_required(uid, latitude : float, longitude : float, c0: float, c1: float, c2 : float, 
                                ignore_pp: bool, fixed_width: bool, turns: str, 
                                draw_all_island: bool,
                                layout: str, margins: float, scale: int, logger):  
    import crschem.crossroad_schematization as cs
    from crschem.model.turning_sidewalk import TurningSidewalk

    if turns == "straight":
        turns = TurningSidewalk.TurnShape.STRAIGHT_ANGLE
    elif turns == "bevel":
        turns = TurningSidewalk.TurnShape.BEVELED
    else:
        turns = TurningSidewalk.TurnShape.ADJUSTED_ANGLE

    layout = cs.CrossroadSchematization.Layout[layout]
    logger.info("LAYOUT %s", layout)

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
                                                    ignore_crossings_for_sidewalks = ignore_pp,
                                                    use_fixed_width_on_branches = fixed_width,
                                                    turn_shape = turns,
                                                    verbose=True)
        logger.info("PROCESS CrossroadSchematization")
        crschem.process()
                
        crschem.toTif(run_path + "/" + "schematization-96.tif", resolution=96, layout=layout, margin=margins, scale=scale, only_reachable_islands=not draw_all_island)
        crschem.toPdf(run_path + "/" + "schematization-300.pdf", resolution=300, layout=layout, margin=margins, scale=scale, only_reachable_islands=not draw_all_island)

        result = "successful export"
    else:
        logger.info("dossier %s déjà présent", run_path)
        result = "already exists"

    return result, run_path
