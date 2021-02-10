// @author         https://github.com/balthild
// @name           Force refresh
// @category       Tweaks
// @version        0.2.0
// @description    Reload intel data without refreshing the page.


window.plugin.forceRefresh = function() {
    const container = L.DomUtil.create('div', 'leaflet-control');
    const toolbar = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', 'leaflet-refresh');
    
    button.innerText = '🗘';
    button.onclick = function() {
        idleReset();
        window.mapDataRequest.cache = new DataCache();
        window.mapDataRequest.refresh();
        window.mapDataRequest.processRequestQueue();
    };

    toolbar.appendChild(button);
    container.appendChild(toolbar);

    document.querySelector('.leaflet-top.leaflet-left').appendChild(container);
};
