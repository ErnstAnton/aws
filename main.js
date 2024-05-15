/* Wetterstationen Euregio Beispiel */

// Innsbruck
let ibk = {
    lat: 47.267222,
    lng: 11.392778
};

// Karte initialisieren
let map = L.map("map", {
    fullscreenControl: true
}).setView([ibk.lat, ibk.lng], 11);

// thematische Layer
let themaLayer = {
    stations: L.featureGroup(),
    temperature: L.featureGroup(),
    wind: L.featureGroup(),
    snow: L.featureGroup().addTo(map),
}

// Hintergrundlayer
L.control.layers({
    "Relief avalanche.report": L.tileLayer(
        "https://static.avalanche.report/tms/{z}/{x}/{y}.webp", {
        attribution: `© <a href="https://sonny.4lima.de">Sonny</a>, <a href="https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b">EU-DEM</a>, <a href="https://lawinen.report/">avalanche.report</a>, all licensed under <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>`
    }).addTo(map),
    "Openstreetmap": L.tileLayer.provider("OpenStreetMap.Mapnik"),
    "Esri WorldTopoMap": L.tileLayer.provider("Esri.WorldTopoMap"),
    "Esri WorldImagery": L.tileLayer.provider("Esri.WorldImagery")
}, {
    "Wetterstationen": themaLayer.stations,
    "Temperatur in °C": themaLayer.temperature,
    "Windgeschwindigkeit in km/h": themaLayer.wind,
    "Schneehöhe in cm": themaLayer.snow,
}).addTo(map);

// Change default options - Rainviewer
L.control.rainviewer({
    position: 'bottomleft',
    nextButtonText: '>',
    playStopButtonText: 'Play/Stop',
    prevButtonText: '<',
    positionSliderLabelText: "Hour:",
    opacitySliderLabelText: "Opacity:",
    animationInterval: 500,
    opacity: 0.5
}).addTo(map);

// Maßstab
L.control.scale({
    imperial: false,
}).addTo(map);


function getColor(value, ramp) {
    for (let rule of ramp) {
        if (value >= rule.min && value < rule.max) {
            return rule.color;
        }
    }
}

// Temperatur
function showTemperature(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            // feature.properties.LT
            if (feature.properties.LT > -50 && feature.properties.LT < 50) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.LT, COLORS.temperature);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};">${feature.properties.LT.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.temperature);
}

//Wind
function showWind(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            // feature.properties.WG
            if (feature.properties.WG > 0 && feature.properties.WG < 250) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.WG, COLORS.wind);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon-wind",
                    html: `<span title="${feature.properties.WG.toFixed(1)} km/h"><i style="transform:rotate(${feature.properties.WR}deg);color:${color}" class="fa-solid fa-circle-arrow-down"></i></span>`
                })
            })
        }
    }).addTo(themaLayer.wind);
}

//Schneehöhe
function showSnow(geojson) {
    L.geoJSON(geojson, {
        filter: function (feature) {
            if (feature.properties.HS > 0 && feature.properties.HS < 1000) {
                return true;
            }
        },
        pointToLayer: function (feature, latlng) {
            let color = getColor(feature.properties.HS, COLORS.snow);
            return L.marker(latlng, {
                icon: L.divIcon({
                    className: "aws-div-icon",
                    html: `<span style="background-color:${color};">${feature.properties.HS.toFixed(1)}</span>`
                })
            })
        }
    }).addTo(themaLayer.snow);
}

// GeoJSON der Wetterstationen laden
async function showStations(url) {
    let response = await fetch(url);
    let geojson = await response.json();

    // Wetterstationen mit Icons und Popups
    L.geoJSON(geojson, {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {
                icon: L.icon({
                    iconUrl: "icons/wifi.png",
                    iconAnchor: [16, 37],
                    popupAnchor: [0, -37]
                })
            });
        },
        onEachFeature: function (feature, layer) {
            let pointInTime = new Date(feature.properties.date);
            layer.bindPopup(`
                  <h4>${feature.properties.name} (${feature.geometry.coordinates[2]}m)</h4>
                  <ul>
                  <li> Lufttemperatur (°C): ${feature.properties.LT || "-"}
                  <li> Relative Luftfeuchte (%): ${feature.properties.RH || "-"}
                  <li> Windgeschwindigkeit (km/h): ${feature.properties.WG || "-"}
                  <li> Schneehöhe (cm): ${feature.properties.SH || "-"}
                  </ul>
                  <span>${pointInTime.toLocaleString()}</span>
                `)
        }
    }).addTo(themaLayer.stations);
    showTemperature(geojson);
    showWind(geojson);
    showSnow(geojson);
}
showStations("https://static.avalanche.report/weather_stations/stations.geojson");
