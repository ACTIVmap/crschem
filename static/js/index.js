var map;
var uid = Math.random().toString(36).slice(2);
var coords = null
requesting = false
layerTactile = null
var osm, osmfr, orthoIGN;
var params = {};

ol.proj.useGeographic()



function setDownload(href = "") {
  // button
  if (href == "") {
    document.getElementById("download_button").setAttribute("disabled", "disabled");
    document.getElementById("download_button").className = "button_disabled button_large"
  }
  else {
    document.getElementById("download_button").removeAttribute("disabled");
    document.getElementById("download_button").className = "button button_large"
  }
  document.getElementById("download_button").href = href;
}

function setParameters(msg = "") {
  // message
  if (msg != "") {
    document.getElementById("text").innerHTML = msg
  }
  // parameters
  document.getElementById("C0").value = params["c0"]
  document.getElementById("C0val").innerHTML = params["c0"]
  document.getElementById("C1").value = params["c1"]
  document.getElementById("C1val").innerHTML = params["c1"]
  document.getElementById("C2").value = params["c2"]
  document.getElementById("C2val").innerHTML = params["c2"]
  document.getElementById("ignore_pp").checked = params["ignore_pp"]
  document.getElementById("draw_all_island").checked = params["draw_all_island"]
  document.getElementById("fixed_width").checked = params["fixed_width"]
  document.getElementById(params["turns"]).checked = true
  document.getElementById(params["layout"]).checked = true
  document.getElementById("margins").value = params["margins"]
  document.getElementById(params["scale"]).checked = true

  document.getElementById("normalize_angles").checked = params["normalize_angles"];
  document.getElementById("angle_normalization").innerHTML = params["angle_normalization"];
  document.getElementById("snap_aligned_streets").checked = params["snap_aligned_streets"];
  document.getElementById("threshold_small_island").value = params["threshold_small_island"];
}

function resetInterface(msg = "", href = "") {
  document.getElementById("interface").className = ''
  document.getElementById("loading").className = 'hidden'
  
  setParameters(msg)

  setDownload(href)
}

function updateOpacity() {
  const opacity = parseFloat(opacityInput.value);
  if (layerTactile != null) {
    layerTactile.setOpacity(opacity);
  }
}

function loadProfile(profil) {
  request = window.location.origin+window.location.pathname+"profile?name=" + profil;
  fetchTimeout(request, 20000).then(response => {
    return response.json(); 
  }).then(json => {
    if (json["error"] === undefined) {
      for (const [key, value] of Object.entries(json)) {
        params[key] = value
      }
      /* TODO params["*/
      setParameters();
    }
    else {
      resetInterface("Erreur pendant la récupération du profile: <pre>" + json["error"] + "</pre>");
    }

  }).catch(error => {
    if (typeof msg !== 'undefined')
    resetInterfaceMessage(msg);
    else
    resetInterface("Le serveur n'a pas répondu. Veuillez réessayer ultérieurement.");
  })
}

function loadParametersFromUI() {
  params["c0"] = document.getElementById("C0").value
  params["c1"] = document.getElementById("C1").value
  params["c2"] = document.getElementById("C2").value
  params["ignore_pp"] = document.getElementById("ignore_pp").checked
  params["draw_all_island"] = document.getElementById("draw_all_island").checked
  params["fixed_width"] = document.getElementById("fixed_width").checked

  params["turns"] = document.querySelector('input[name="turns"]:checked').value;
  params["layout"] = document.querySelector('input[name="layout"]:checked').value;
  params["margins"] = document.getElementById("margins").value;
  params["scale"] = document.querySelector('input[name="scale"]:checked').value;

  params["normalize_angles"] = document.getElementById("normalize_angles").checked;
  params["angle_normalization"] = document.getElementById("angle_normalization").innerHTML;
  params["snap_aligned_streets"] = document.getElementById("snap_aligned_streets").checked;
  params["threshold_small_island"] = document.getElementById("threshold_small_island").value;
}

/* Core function */
function getSchematization(e, comment="") {
    // Fetch parameters
    coords = e.coordinate;

    getSchematizationFromCoords(comment);
}

function getSchematizationFromCoords(comment = "") {
  if(!requesting){
    var lat = coords[1];
    var lng = coords[0];

        
    requesting = true
    disableReload()


    loadParametersFromUI();
    
    comment = comment.replaceAll("\n", "%0A")

    // Replace content with loading animation
    document.getElementById("interface").className = 'hidden'
    document.getElementById("loading").className = ''
    
    // add command line after clic
    updateCommandLine(lng, lat)

    request = window.location.origin+window.location.pathname+"schematization"+"?lat="+lat+"&lng="+lng+"&c0="+params["c0"]+"&c1="+params["c1"]+"&c2="+params["c2"]
    request += "&ignore_pp="+params["ignore_pp"]+"&fixed_width="+params["fixed_width"]+"&turns="+params["turns"]
    request += "&draw_all_island="+params["draw_all_island"]
    request += "&layout="+params["layout"]+"&margins="+params["margins"]+"&scale="+params["scale"]
    request += "&normalize_angles="+params["normalize_angles"]+"&angle_normalization="+params["angle_normalization"]+"&snap_aligned_streets="+params["snap_aligned_streets"]+"&threshold_small_island="+params["threshold_small_island"]
    request += "&uid="+uid+"&comment="+comment
    // Fetch data from the API. Timeout of 10s.
    fetchTimeout(request, 20000).then(response => {
      return response.json(); 
    }).then(json => {
      if (json["error"] === undefined) {

        // Put the content back on the page
        resetInterface("", json["pdf-300"])

        // integrate small image on the map
        fetch(json["tif-96"]).then((response) => response.blob()).then((blob) => {

          console.log("Create source");
          const source = new ol.source.GeoTIFF({
            sources: [
              {
                blob: blob
              }]});

          if (layerTactile != null) {
            console.log("Remove previous layer")
            map.removeLayer(layerTactile);
          }


          console.log("Create layer from the geotiff");
          layerTactile = new ol.layer.WebGLTile({
            source: source,
          });

          // add layer to the map
          console.log("Add layer to the map");
          map.addLayer(layerTactile);
          updateOpacity();

          console.log("update interface");
          // Display a message to indicate that the comment was sent 
          if(comment != "") {
            document.getElementById("comment_text").value = ""
            document.getElementById("text").innerHTML = "Votre commentaire a bien été envoyé."
          }
          point = new ol.geom.Point([lng, lat], 'XY');
          const view = map.getView();
          view.fit(point);
          view.setZoom(20);


          // Update UI elements and enable to request again
          updateSendButton(document.getElementById("comment_text").value)
          requesting = false
        });

      }
      else {
        resetInterface("Erreur pendant l'exécution: <pre>" + json["error"] + "</pre><br /> Veuillez choisir un autre carrefour.");
        
        requesting = false
      }

    }).catch(error => {
      console.error(error);
      if (typeof msg !== 'undefined')
      resetInterfaceMessage(msg);
      else
      resetInterface("Le serveur n'a pas répondu. Veuillez réessayer ultérieurement.");
      requesting = false
    })
  }
}

/* Handler functions */

function reloadSchematization() {
  getSchematizationFromCoords()
}

function sendComment() {
  comment = document.getElementById("comment_text").value
  getSchematizationFromCoords(comment)
}

function downloadPDF() {
    // TODO
}

function selectElement(elem_name) {
  list = ["comment", "settings"];

  // change panel
  elems = list.map(document.getElementById, document);
  elems.forEach(element => {
      if (element.id == elem_name) {
        element.className = "selected_panel";
      }
      else {
        element.className = "panel";
      }
  });

  // change button
  list.forEach(function(part, index) {
    this[index] = this[index] +"_button";
  }, list);

  elems = list.map(document.getElementById, document);
  elems.forEach(element => {
      if (element.id == elem_name + "_button") {
        element.className = "button tab selected";
      }
      else {
        element.className = "button tab";
      }
  });

  document.getElementById("content").scrollTop = document.getElementById("content").scrollHeight;
}

function selectComment() {
  selectElement("comment");
}

function selectSettings() {
  selectElement("settings");
}

/* UI updating functions */

function enableReload() {
  if(coords != null) {
    reload_button = document.getElementById("reload_button")
    reload_button.removeAttribute("disabled")
    reload_button.className = "button button_large"
  }
}

function disableReload() {
  reload_button = document.getElementById("reload_button")
  reload_button.setAttribute("disabled", "disabled")
  reload_button.className = "button_disabled button_large"
}

function updateSendButton(message) {
  send_button = document.getElementById("send_button")
  if(message.trim().length > 0 && coords != null) {
    send_button.className = "button"
    send_button.removeAttribute("disabled")
  }
  else {
    send_button.className = "button_disabled"
    send_button.setAttribute("disabled", "disabled");
  }
}

function updateSlider(slider, value) {
  document.getElementById(slider.id+"val").innerHTML = value
  slider.value = value
  enableReload()
}

function setActiveProfile(e) {
  id_selected = document.querySelector('#profil-selection').selectedIndex;
  profil = document.querySelector('#profil-selection').options[id_selected].value;

  if (profil == "manual") {
    document.getElementById('generalization').className = "";
  }
  else {
    document.getElementById('generalization').className = "hidden";
    loadProfile(profil);
  }
}

function updateCommandLine(x = null, y = null) {
  if (x == null || y == null) {
    const view = map.getView();
    const center = view.getCenter();
    x = center[0].toFixed(6);
    y = center[1].toFixed(6);
  }
  loadParametersFromUI()

  var command = "PYTHONPATH=$PWD examples/get-crossroad-schematization.py --osm -l --display-preview -c " + y + " " + x + 
    " --c0 " + params["c0"] + " --c1 " + params["c1"] + " --c2 " + params["c2"]

  if (params["ignore_pp"])
    command += " --ignore-crossings-for-sidewalks"
  if (params["draw_all_island"])
    command += " --non-reachable-islands"
  if (params["fixed_width"])
    command += " --use-fixed-width-on-branches"

  if (params["turns"] == "bevel") {
    command += " --turn-shape BEVELED"
  }
  else if (params["turns"] == "straight") {
    command += " --turn-shape STRAIGHT_ANGLE"
  }
  else if (params["turns"] == "adjusted") {
    command += " --turn-shape ADJUSTED_ANGLE"
  }

  command += " --scale " + params["scale"]
  command += " --layout " + params["layout"]
  command += " --margin " + params["margins"]

  command += " --threshold-small-island " + params["threshold_small_island"]
  if (params["normalize_angles"])
    command += " --normalizing-angles " + params["angle_normalization"]
  else
    command += " --normalizing-angles 0"
  if (! params["snap_aligned_streets"])
    command += " --no-snap-aligned-streets"

  document.getElementById("command_line").innerHTML = command
}

function resetParameters() {

  params["c0"] = 2
  params["c1"] = 2
  params["c2"] = 4
  params["ignore_pp"] = false
  params["draw_all_island"] = false
  params["fixed_width"] = false

  params["turns"] = "adjusted";
  params["layout"] = "A5_landscape";
  params["margins"] = 1.0;
  params["scale"] = "400";

  params["normalize_angles"] = true;
  params["angle_normalization"] = 8;
  params["snap_aligned_streets"] = true;
  params["threshold_small_island"] = 30;

  setParameters();
}

function setVisibleMap() {
  bg = document.querySelector('input[name="background"]:checked').value;

  osmfr.setVisible(bg == "osm-fr");
  osm.setVisible(bg == "osm");
  orthoIGN.setVisible(bg == "ortho-ign");
}

/* Initialisation function */
function init() {

  let zoom = 14;
  let center = [3.0869, 45.7719]; // Clermont-Ferrand
  if (window.location.hash !== '') {
    // try to restore center, zoom-level and rotation from the URL
    const hash = window.location.hash.replace('#map=', '');
    const parts = hash.split('/');
    if (parts.length === 4) {
      zoom = parseFloat(parts[0]);
      center = [parseFloat(parts[1]), parseFloat(parts[2])];
    }
  }

  osm = new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: [
        'All maps © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      ],
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      crossOrigin: null,
    }),
  });

  osmfr = new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: [
        'All maps © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      ],
      url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      crossOrigin: null,
    }),
  });
  
  orthoIGN = new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: [
        'IGN-F / Geoportail',
      ],
      url: "https://wxs.ign.fr/choisirgeoportail/geoportail/wmts?" +
      "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
      "&STYLE=normal" +
      "&TILEMATRIXSET=PM" +
      "&FORMAT=image/jpeg"+
      "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS"+
      "&TILEMATRIX={z}" +
      "&TILEROW={y}" +
      "&TILECOL={x}",
      crossOrigin: null,
    }),
  });

  view_main = new ol.View({
    maxZoom: 22,
    center: center,
    zoom: zoom,
  })

  map = new ol.Map({
    layers: [osmfr, osm, orthoIGN],
    target: 'map',
    view: view_main
  });

  setVisibleMap();
  

  // Enable interaction on the map to get the description
  map.on("click", getSchematization);

  // Reinit some UI elements
  document.getElementById("comment_text").value = ""
  resetParameters()

  // Load url parameters
  url_params = new URLSearchParams(window.location.search);


  // reencode the window location in the url
  let shouldUpdate = true;
  const view = map.getView();
  const updatePermalink = function () {
    if (!shouldUpdate) {
      // do not update the URL when the view was changed in the 'popstate' handler
      shouldUpdate = true;
      return;
    }

    const center = view.getCenter();
    const zoom = view.getZoom().toFixed(2);
    const x = center[0].toFixed(6);
    const y = center[1].toFixed(6);
    const hash =
      '#map=' +
      zoom +
      '/' +
      x +
      '/' +
      y +
      '/' +
      view.getRotation();
    const state = {
      zoom: view.getZoom(),
      center: view.getCenter(),
      rotation: view.getRotation(),
    };
    document.getElementById("osm_button").href = "https://www.openstreetmap.org/edit#map=" + zoom + "/" + y + "/" + x
    document.getElementById("streetview_button").href = 'http://maps.google.com/maps?q=&layer=c&cbll=' + y + "," + x + '&cbp=11,0,0,0,0';
    window.history.pushState(state, 'map', hash);
    
  };

  map.on('moveend', updatePermalink);


  opacityInput = document.getElementById('opacity');
  opacityInput.removeAttribute("disabled");
  opacityInput.addEventListener('input', updateOpacity);
  document.querySelectorAll("input[name='background']").forEach((input) => {
    input.addEventListener('change', setVisibleMap);
  });

  normalizeAngles = document.getElementById('normalize_angles');
  normalizeAngles.addEventListener('change', (e) => {
    var checked = document.getElementById('normalize_angles').checked;
    normalizeAngles = document.getElementById('angle_normalization');
    normalizeAnglesPanel = document.getElementById('normalize_angles_param');
    if (checked) {
      normalizeAngles.removeAttribute("disabled");
      normalizeAnglesPanel.className = "";
    }
    else {
      normalizeAngles.setAttribute("disabled", "disabled");
      normalizeAnglesPanel.className = "disabled";
    }
    
    
  });

  document.querySelectorAll("input").forEach((input) => {
    input.addEventListener('change', enableReload)});
  
  document.querySelectorAll("select").forEach((input) => {
    input.addEventListener('change', enableReload)});

  document.getElementById('profil-selection').addEventListener("change", setActiveProfile);
  setActiveProfile();

}