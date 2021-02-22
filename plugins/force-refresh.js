// @author         https://github.com/balthild
// @name           Force refresh
// @category       Tweaks
// @version        0.2.5
// @description    Reload intel data without refreshing the page.

window.plugin.forceRefresh = function() {};

window.plugin.forceRefresh.onRefreshClick = function() {
  window.idleReset();
  window.mapDataRequest.cache = new DataCache();
  window.mapDataRequest.refresh();
  window.mapDataRequest.processRequestQueue();
}

var setup = function() {
  var container = L.DomUtil.create('div', 'leaflet-control');
  var toolbar = L.DomUtil.create('div', 'leaflet-bar');
  var button = L.DomUtil.create('a', 'leaflet-refresh');

  $(button).text("↻").on('click', window.plugin.forceRefresh.onRefreshClick)
           .appendTo(toolbar)
           .parent().appendTo(container)
           .parent().appendTo('.leaflet-top.leaflet-left');
};
