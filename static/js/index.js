var map;
var uid = Math.random().toString(36).slice(2);
coords = null
requesting = false
layerTactile = null
content = ""

ol.proj.useGeographic()



function setDownload(href = "") {
  // button
  if (href == "") {
    document.getElementById("download_button").disabled = true
    document.getElementById("download_button").className = "button_disabled button_large"
  }
  else {
    document.getElementById("download_button").disabled = false
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
  document.getElementById("C0").value = c0
  document.getElementById("C0val").innerHTML = c0
  document.getElementById("C1").value = c1
  document.getElementById("C1val").innerHTML = c1
  document.getElementById("C2").value = c2
  document.getElementById("C2val").innerHTML = c2
  document.getElementById("ignore_pp").checked = ignore_pp
  document.getElementById("fixed_width").checked = fixed_width
  document.getElementById(turns).checked = true
  document.getElementById(layout).checked = true
  document.getElementById("margins").value = margins
}

function resetInterface(msg = "", href = "") {
  document.getElementById("content").innerHTML = content
  
  setParameters(msg)

  setDownload(href)
}

function updateOpacity() {
  const opacity = parseFloat(opacityInput.value);
  if (layerTactile != null) {
    layerTactile.setOpacity(opacity);
  }
}


/* Core function */
function getSchematization(e, comment="") {
  if(!requesting){
    requesting = true
    disableReload()

    // Fetch parameters
    var coords = e.coordinate;
    var lat = coords[1];
    var lng = coords[0];
    c0 = document.getElementById("C0").value
    c1 = document.getElementById("C1").value
    c2 = document.getElementById("C2").value
    ignore_pp = document.getElementById("ignore_pp").checked
    fixed_width = document.getElementById("fixed_width").checked

    turns = document.querySelector('input[name="turns"]:checked').value;
    layout = document.querySelector('input[name="layout"]:checked').value;
    margins = document.getElementById("margins").value;

    comment = comment.replaceAll("\n", "%0A")

    // Replace content with loading animation
    document.getElementById("content").innerHTML = '<div id="loading" class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'
    
    // Fetch data from the API. Timeout of 10s.
    fetchTimeout(window.location.origin+window.location.pathname+"schematization"+"?lat="+lat+"&lng="+lng+"&c0="+c0+"&c1="+c1+"&c2="+c2+"&ignore_pp="+ignore_pp+"&fixed_width="+fixed_width+"&turns="+turns+"&layout="+layout+"&margins="+margins+"&uid="+uid+"&comment="+comment, 10000).then(response => {
      return response.json(); 
    }).then(json => {
      if (json["error"] === undefined) {

        // Put the content back on the page
        resetInterface("", json["tif-300"])

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
          opacityInput = document.getElementById('opacity');
          opacityInput.disabled = false;
          opacityInput.addEventListener('input', updateOpacity);

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
  getSchematization({latlng : coords})
}

function sendComment() {
  comment = document.getElementById("comment_text").value
  getSchematization({latlng : coords}, comment)
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
  reload_button = document.getElementById("reload_button")
  reload_button.disabled = false
  reload_button.className = "button"
}

function disableReload() {
  reload_button = document.getElementById("reload_button")
  reload_button.disabled = true
  reload_button.className = "button_disabled"
}

function updateSendButton(message) {
  send_button = document.getElementById("send_button")
  if(message.trim().length > 0 && coords != null) {
    send_button.className = "button"
    send_button.disabled = false
  }
  else {
    send_button.className = "button_disabled"
    send_button.disabled = true
  }
}

function updateSlider(slider, value) {
  document.getElementById(slider.id+"val").innerHTML = value
  slider.value = value
  if(coords != null) {
    enableReload()
  }
}

function resetParameters() {
  document.getElementById("C0").value = 2
  document.getElementById("C1").value = 2
  document.getElementById("C2").value = 4
  document.getElementById("C0val").innerHTML = 2
  document.getElementById("C1val").innerHTML = 2
  document.getElementById("C2val").innerHTML = 4

  document.getElementById("ignore_pp").checked = false;
  document.getElementById("fixed_width").checked = false;

  document.getElementById("adjusted").checked = true;
  document.getElementById("margins").value = 1.0;
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

  const osmfr = new ol.layer.Tile({
    source: new ol.source.OSM({
      attributions: [
        'All maps © <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
      ],
      url: 'https://{a-c}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
      crossOrigin: null,
    }),
  });
  
  view_main = new ol.View({
    maxZoom: 22,
    center: center,
    zoom: zoom,
  })

  map = new ol.Map({
    layers: [osmfr],
    target: 'map',
    view: view_main
  });
  

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
    window.history.pushState(state, 'map', hash);
  };

  map.on('moveend', updatePermalink);

  // default content
  content = document.getElementById("content").innerHTML

}