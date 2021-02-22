// @author         https://github.com/balthild
// @name           Force refresh
// @category       Tweaks
// @version        0.2.3
// @description    Reload intel data without refreshing the page.

window.plugin.forceRefresh = function() {};

window.plugin.forceRefresh.onRefreshClick = function() {
  window.idleReset();
}

var setup = function() {
  var container = L.DomUtil.create('div', 'leaflet-control');
  var toolbar = L.DomUtil.create('div', 'leaflet-bar');
  var button = L.DomUtil.create('a', 'leaflet-refresh');

    button.innerText = '↻';
    button.onclick = window.plugin.forceRefresh.onRefreshClick;

    toolbar.appendChild(button);
    container.appendChild(toolbar);

    document.querySelector('.leaflet-top.leaflet-left').appendChild(container);
};
