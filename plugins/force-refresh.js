// @author         https://github.com/balthild
// @name           Force refresh
// @category       Tweaks
// @version        0.2.2
// @description    Reload intel data without refreshing the page.


const setup = function() {
    const container = L.DomUtil.create('div', 'leaflet-control');
    const toolbar = L.DomUtil.create('div', 'leaflet-bar');
    const button = L.DomUtil.create('a', 'leaflet-refresh');

    button.innerText = '↻';
    button.onclick = function() {
        window.idleReset();
    };

    toolbar.appendChild(button);
    container.appendChild(toolbar);

    document.querySelector('.leaflet-top.leaflet-left').appendChild(container);
};
