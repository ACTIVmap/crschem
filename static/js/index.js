var map;
var uid = Math.random().toString(36).slice(2);
coords = null
requesting = false
layerTactile = null
content = ""

function resetInterface(msg) {
  document.getElementById("content").innerHTML = content
  document.getElementById("C0").value = c0
  document.getElementById("C1").value = c1
  document.getElementById("C2").value = c2
  document.getElementById("text").innerHTML = msg
  document.getElementById("download_button").disabled = true
  document.getElementById("download_button").className = "button_disabled button_large"
  document.getElementById("download_button").href = "";
}

/* Core function */
function getSchematization(e, comment="") {
  if(!requesting){
    requesting = true
    disableReload()

    // Fetch parameters
    var coords = ol.proj.toLonLat(e.coordinate);
    var lat = coords[1];
    var lng = coords[0];
    c0 = document.getElementById("C0").value
    c1 = document.getElementById("C1").value
    c2 = document.getElementById("C2").value
    comment = comment.replaceAll("\n", "%0A")

    // Replace content with loading animation
    document.getElementById("content").innerHTML = '<div id="loading" class="lds-spinner"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div>'
    
    // Fetch data from the API. Timeout of 10s.
    fetchTimeout(window.location.origin+window.location.pathname+"schematization"+"?lat="+lat+"&lng="+lng+"&c0="+c0+"&c1="+c1+"&c2="+c2+"&uid="+uid+"&comment="+comment, 10000).then(response => {
      console.log(response);
      return response.json(); 
    }).then(json => {

      // Put the content back on the page
      document.getElementById("content").innerHTML = content
      document.getElementById("C0").value = c0
      document.getElementById("C1").value = c1
      document.getElementById("C2").value = c2
      document.getElementById("download_button").disabled = false
      document.getElementById("download_button").className = "button button_large"
      document.getElementById("download_button").href = json["pdf"]

      console.log("Create source");
      const source = new ol.source.GeoTIFF({
        sources: [
          {
            url: json["tif"]
          }]});

      console.log("Create layer from the geotiff");
      const layer = new ol.layer.WebGLTile({
        source: source,
      });

      // add layer to the map (TODO: remove the previous one)
      console.log("Add layer to the map");
      map.addLayer(layer);
      console.log(layer);

      console.log("update interface");
      // Display a message to indicate that the comment was sent 
      if(comment != "") {
        document.getElementById("comment_text").value = ""
        document.getElementById("text").innerHTML = "Votre commentaire a bien été envoyé."
      }

      // Update UI elements and enable to request again
      updateSendButton(document.getElementById("comment_text").value)
      requesting = false

    }).catch(error => {
      console.error(error)
      if (typeof msg !== 'undefined')
        resetInterface(msg);
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

function toggleComment() {
  comment = document.getElementById("comment")
  if(comment.style.display != "grid") {
    comment.style.display = "grid"
    document.getElementById("content").scrollTop = document.getElementById("content").scrollHeight;
  }
  else
    comment.style.display = "none"  
}

function toggleSettings() {
  settings = document.getElementById("settings")
  if(settings.style.display != "grid") {
    settings.style.display = "grid"
    document.getElementById("content").scrollTop = document.getElementById("content").scrollHeight;
  }
  else
    settings.style.display = "none"
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

function resetSliders() {
  document.getElementById("C0").value = 2
  document.getElementById("C1").value = 2
  document.getElementById("C2").value = 4
  document.getElementById("C0val").innerHTML = 2
  document.getElementById("C1val").innerHTML = 2
  document.getElementById("C2val").innerHTML = 4
}

/* Initialisation function */
function init() {

  let zoom = 14;
  let center = [343737.316198, 5742675.716551];
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
    view: view_main,
  });
  

  // Enable interaction on the map to get the description
  map.on("click", getSchematization);

  // Reinit some UI elements
  document.getElementById("comment_text").value = ""
  resetSliders()

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
    const hash =
      '#map=' +
      view.getZoom().toFixed(2) +
      '/' +
      center[0].toFixed(2) +
      '/' +
      center[1].toFixed(2) +
      '/' +
      view.getRotation();
    const state = {
      zoom: view.getZoom(),
      center: view.getCenter(),
      rotation: view.getRotation(),
    };
    window.history.pushState(state, 'map', hash);
  };

  map.on('moveend', updatePermalink);

  // default content
  content = document.getElementById("content").innerHTML

}