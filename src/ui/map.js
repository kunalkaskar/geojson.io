var popup = require('../lib/popup');

module.exports = function(context) {

    function map(selection) {
        context.map = L.mapbox.map(selection.node())
            .setView([20, 0], 2)
            .addControl(L.mapbox.geocoderControl('tmcw.map-u4ca5hnt'));

        context.mapLayer = L.featureGroup().addTo(context.map);

        context.drawControl = new L.Control.Draw({
            edit: { featureGroup: context.mapLayer },
            draw: { circle: false }
        }).addTo(context.map);

        context.map
            .on('draw:edited', update)
            .on('draw:deleted', update)
            .on('draw:created', created)
            .on('popupopen', popup(context));

        function update() {
            geojsonToLayer(context.mapLayer.toGeoJSON(), context.mapLayer);
            context.data.set({map: layerToGeoJSON(context.mapLayer)}, 'map');
        }

        context.dispatch.on('change.map', function(event) {
            geojsonToLayer(context.data.map, context.mapLayer);
        });

        function created(e) {
            context.mapLayer.addLayer(e.layer);
            update();
        }
    }

    function layerToGeoJSON(layer) {
        var features = [];
        layer.eachLayer(collect);
        function collect(l) { if ('toGeoJSON' in l) features.push(l.toGeoJSON()); }
        return {
            type: 'FeatureCollection',
            features: features
        };
    }

    return map;
};

function geojsonToLayer(geojson, layer) {
    layer.clearLayers();
    L.geoJson(geojson).eachLayer(add);
    function add(l) {
        bindPopup(l);
        l.addTo(layer);
    }
}

function bindPopup(l) {

    var properties = l.toGeoJSON().properties, table = '';

    if (!properties) return;

    if (!Object.keys(properties).length) properties = { '': '' };

    for (var key in properties) {
        table += '<tr><th><input type="text" value="' + key + '" /></th>' +
            '<td><input type="text" value="' + properties[key] + '" /></td></tr>';
    }

    l.bindPopup(L.popup({
        maxWidth: 500,
        maxHeight: 400
    }, l).setContent('<div class="clearfix"><div class="marker-properties-limit"><table class="marker-properties">' + table + '</table></div>' +
        '<div class="clearfix col12 drop">' +
            '<div class="buttons-joined fl"><button class="save positive">save</button>' +
            '<button class="cancel">cancel</button></div>' +
            '<div class="fr clear-buttons"><button class="delete-invert"><span class="icon-remove-sign"></span> remove</button></div>' +
        '</div></div>'));
}
