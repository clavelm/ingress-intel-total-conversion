// ==UserScript==
// @id             iitc-plugin-force-refresh
// @name           IITC plugin: force refresh
// @category       Tweaks
// @version 0.1.3
// @namespace	https://github.com/clavelm/iitc-plugins-refresh
// @downloadURL	https://github.com/clavelm/iitc-plugins-refresh/raw/main/force-refresh.user.js
// @homepageURL	https://github.com/clavelm/iitc-plugins-refresh
// @description Reload intel data without refreshing the page.
// @author https://github.com/balthild
// @include		https://intel.ingress.com/*
// @match		https://intel.ingress.com/*
// @grant          none
// ==/UserScript==


function wrapper(plugin_info) {
// ensure plugin framework is there, even if iitc is not yet loaded
if(typeof window.plugin !== 'function') window.plugin = function() {};


// PLUGIN START ////////////////////////////////////////////////////////

var setup = function() {
    var container = L.DomUtil.create('div', 'leaflet-control');
    var toolbar = L.DomUtil.create('div', 'leaflet-bar');
    var button = L.DomUtil.create('a', 'leaflet-refresh');

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

// PLUGIN END //////////////////////////////////////////////////////////


setup.info = plugin_info; //add the script info data to the function as a property
if(!window.bootPlugins) window.bootPlugins = [];
window.bootPlugins.push(setup);
// if IITC has already booted, immediately run the 'setup' function
if(window.iitcLoaded && typeof setup === 'function') setup();
} // wrapper end
// inject code into site context
var script = document.createElement('script');
var info = {};
if (typeof GM_info !== 'undefined' && GM_info && GM_info.script) info.script = { version: GM_info.script.version, name: GM_info.script.name, description: GM_info.script.description };
script.appendChild(document.createTextNode('('+ wrapper +')('+JSON.stringify(info)+');'));
(document.body || document.head || document.documentElement).appendChild(script);
