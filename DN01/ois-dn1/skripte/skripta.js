/* global L, distance */

var pot;

// seznam z markerji na mapi
var markerji = [];

var mapa;
var obmocje;

const FRI_LAT = 46.05004;
const FRI_LNG = 14.46931;


/**
 * Ko se stran naloži, se izvedejo ukazi spodnje funkcije
 */
window.addEventListener('load', function () {

  // Osnovne lastnosti mape
  var mapOptions = {
    center: [FRI_LAT, FRI_LNG],
    zoom: 12
    // maxZoom: 3
  };

  // Ustvarimo objekt mapa
  mapa = new L.map('mapa_id', mapOptions);

  // Ustvarimo prikazni sloj mape
  var layer = new L.TileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

  // Prikazni sloj dodamo na mapo
  mapa.addLayer(layer);

  // Ročno dodamo fakulteto za računalništvo in informatiko na mapo
  dodajMarker(FRI_LAT, FRI_LNG, "FAKULTETA ZA RAČUNALNIŠTVO IN INFORMATIKO", "FRI");

  // Objekt oblačka markerja
  var popup = L.popup();

  function obKlikuNaMapo(e) {
    var latlng = e.latlng;
   /* popup
      .setLatLng(latlng)
      .setContent("Izbrana točka:" + latlng.toString())
      .openOn(mapa);
      */

    prikazPoti(latlng);
  }

  mapa.on('click', obKlikuNaMapo);
  document.querySelector("#dodajFakultete").addEventListener('click',dodajFakultete);
    document.querySelector("#dodajRestavracije").addEventListener('click',dodajRestavracije);
  
  document.getElementById("idRadij").addEventListener("click", function() {
      prikaziObmocje();
  });
  
  document.getElementById("radij").addEventListener("keyup", function() {
      prikaziObmocje();
      posodobiOznakeNaZemljevidu();
  });

  document.getElementById("izbrisiRezultate")
    .addEventListener("click", function() {
      // Odstrani vse oznake iz zemljevida
      for (var i=1; i < markerji.length; i++) {
        mapa.removeLayer(markerji[i]);  
      }
      // Odstrani vse oznake, razen FRI
      markerji.splice(1);
      // Onemogoči gumb
      document.getElementById("izbrisiRezultate").disabled = true;
      // Ponovno omogoči oba gumba za dodajanje
      document.getElementById("dodajFakultete").disabled = false;
      document.getElementById("dodajRestavracije").disabled = false;
      // Resetiraj število najdenih zadetkov
      document.getElementById("fakultete_rezultati").innerHTML = 0;
      document.getElementById("restavracije_rezultati").innerHTML = 0;
    });

 
  
});


/**
 * Na zemljevid dodaj oznake z bližnjimi fakultetami in
 * gumb onemogoči.
 */
function dodajFakultete() {
  pridobiPodatke("fakultete", function (jsonRezultat) {
    izrisRezultatov(jsonRezultat);
    document.getElementById("dodajFakultete").disabled = true;
    document.getElementById("izbrisiRezultate").disabled = false;
        document.getElementById("fakultete_rezultati").innerHTML=jsonRezultat.stRezultatov;

  });
}


/**
 * Na zemljevid dodaj oznake z bližnjimi restavracijami in 
 * gumb onemogoči.
 */
function dodajRestavracije() {
  pridobiPodatke("restavracije", function (jsonRezultat) {
    izrisRezultatov(jsonRezultat);
    document.getElementById("dodajRestavracije").disabled = true;
    document.getElementById("izbrisiRezultate").disabled = false;
    document.getElementById("restavracije_rezultati").innerHTML=jsonRezultat.stRezultatov;

  });
}


/**
 * Za podano vrsto interesne točke dostopaj do JSON datoteke
 * in vsebino JSON datoteke vrni v povratnem klicu
 * 
 * @param vrstaInteresneTocke "fakultete" ali "restavracije"
 * @param callback povratni klic z vsebino zahtevane JSON datoteke
 */
function pridobiPodatke(vrstaInteresneTocke, callback) {
  if (typeof(vrstaInteresneTocke) != "string") return;

  var xobj = new XMLHttpRequest();
  xobj.overrideMimeType("application/json");
  xobj.open("GET", "https://teaching.lavbic.net/cdn/OIS/DN1/" + 
    vrstaInteresneTocke + ".json", true);
  xobj.onreadystatechange = function () {
    // rezultat ob uspešno prebrani datoteki
    if (xobj.readyState == 4 && xobj.status == "200") {
        var json = JSON.parse(xobj.responseText);
        
        // nastavimo ustrezna polja (število najdenih zadetkov)
        json.stRezultatov=json.features.length;
        // vrnemo rezultat
        callback(json);
    }
  };
  xobj.send(null);
}


/**
 * Dodaj izbrano oznako na zemljevid na določenih GPS koordinatah,
 * z dodatnim opisom, ki se prikaže v oblačku ob kliku in barvo
 * ikone, glede na tip oznake (FRI = rdeča, druge fakultete = modra in
 * restavracije = zelena)
 * 
 * @param lat zemljepisna širina
 * @param lng zemljepisna dolžina
 * @param opis sporočilo, ki se prikaže v oblačku
 * @param tip "FRI", "restaurant" ali "faculty"
 */
function dodajMarker(lat, lng, opis, tip) {
  var ikona = new L.Icon({
    iconUrl: 'https://teaching.lavbic.net/cdn/OIS/DN1/' + 
      'marker-icon-2x-' + 
      (tip == 'FRI' ? 'red' : (tip == 'restaurant' ? 'green' : 'blue')) + 
      '.png',
    shadowUrl: 'https://teaching.lavbic.net/cdn/OIS/DN1/' + 
      'marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Ustvarimo marker z vhodnima podatkoma koordinat 
  // in barvo ikone, glede na tip
  var marker = L.marker([lat, lng], {icon: ikona});

  // Izpišemo želeno sporočilo v oblaček
  marker.bindPopup("<div>Naziv: " + opis + "</div>").openPopup();

  // Dodamo točko na mapo in v seznam
  marker.addTo(mapa);
  markerji.push(marker);
}


/**
 * Na podlagi podanih interesnih točk v GeoJSON obliki izriši
 * posamezne točke na zemljevid
 * 
 * @param jsonRezultat interesne točke v GeoJSON obliki
 */
function izrisRezultatov(jsonRezultat) {
  var znacilnosti = jsonRezultat.features;

  for (var i = 0; i < znacilnosti.length; i++) {
    var jeObmocje = 
      typeof(znacilnosti[i].geometry.coordinates[0]) == "object";
    var opis = znacilnosti[i].properties.name;

    // pridobimo koordinate
    var lng = jeObmocje ? znacilnosti[i].geometry.coordinates[0][0][0] : 
      znacilnosti[i].geometry.coordinates[0];
    var lat = jeObmocje ? znacilnosti[i].geometry.coordinates[0][0][1] : 
      znacilnosti[i].geometry.coordinates[1];
    if (prikaziOznako(lng, lat))
      dodajMarker(lat, lng, opis, znacilnosti[i].properties.amenity);
  }
 
}


/**
 * Glede na vrednost radija območja izbriši oz. dodaj
 * oznake na zemljevid.
 */
function posodobiOznakeNaZemljevidu() {
  // FRI marker pustimo, ostale odstranimo
  for (var i = 1; i < markerji.length; i++) {
    mapa.removeLayer(markerji[i]);
  }
  
  if (document.getElementById("dodajFakultete").disabled) {
    pridobiPodatke("fakultete", function(jsonRezultat) {
        izrisRezultatov(jsonRezultat);
    });
  }
  
  if (document.getElementById("dodajRestavracije").disabled) {
    pridobiPodatke("restavracije", function(jsonRezultat) {
        izrisRezultatov(jsonRezultat);
    });
  }
}


/**
 * Prikaz poti od/do izbrane lokacije do/od FRI
 * 
 * @param latLng izbrana točka na zemljevidu
 */
function prikazPoti(latLng) {
  // Izbrišemo obstoječo pot, če ta obstaja
  if (pot != null) 
  { 
    mapa.removeControl(pot);
  }
  // pot do fri
  if (document.getElementById("idDoFri").checked==true) {
    pot = L.Routing.control({
      language: 'sl', 
      waypoints: [L.latLng(latLng.lat, latLng.lng), L.latLng(FRI_LAT, FRI_LNG)],
      lineOptions: {
        styles:[{color: '#242c81',weight: 12}]
      }
      
    }).addTo(mapa)
  }
  // pot iz fri
   if (document.getElementById("idIzFri").checked==true) {
    pot = L.Routing.control({
      language: 'sl', 
      waypoints: [L.latLng(FRI_LAT, FRI_LNG), L.latLng(latLng.lat, latLng.lng) ],
      lineOptions: {
        styles:[{color: '#242c81', weight:12}]
      }
      
    }).addTo(mapa);
  }

  
}


/**
 * Preveri ali izbrano oznako na podanih GPS koordinatah izrišemo
 * na zemljevid glede uporabniško določeno vrednost radij, ki
 * predstavlja razdaljo od FRI.
 * 
 * Če radij ni določen, je enak 0 oz. je večji od razdalje izbrane
 * oznake od FRI, potem oznako izrišemo, sicer ne.
 * 
 * @param lat zemljepisna širina
 * @param lng zemljepisna dolžina
 */
function prikaziOznako(lng, lat) {
  var radij = vrniRadij();
  if (radij == 0)
    return true;
  else if (distance(lat, lng, FRI_LAT, FRI_LNG, "K") >= radij) 
    return false;
  else
    return true;
}


/**
 * Na zemljevidu nariši rdeč krog z transparentnim rdečim polnilom
 * s središčem na lokaciji FRI in radijem. Območje se izriše 
 * le, če je na strani izbrana vrednost "Prikaz radija".
 */
function prikaziObmocje() {
  if (document.getElementById("idRadij").checked) {
    if (obmocje != null) mapa.removeLayer(obmocje);
    obmocje = L.circle([FRI_LAT, FRI_LNG], {
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.10,
      radius: vrniRadij() * 1000
    }).addTo(mapa);
  } else if (obmocje != null) {
    mapa.removeLayer(obmocje);
  }
}


/**
 * Vrni celoštevilsko vrednost radija, ki ga uporabnik vnese v 
 * vnosno polje. Če uporabnik vnese neveljavne podatke, je
 * privzeta vrednost radija 0.
 */
function vrniRadij() {
  var vrednost = document.getElementById("radij");
  if (vrednost == null) {
    vrednost = 0;
  } else {
    vrednost = parseInt(vrednost.value, 10);
    vrednost = isNaN(vrednost) ? 0 : vrednost;
  }
  return vrednost;
}