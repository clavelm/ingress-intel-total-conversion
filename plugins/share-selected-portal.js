// @author         Mathieu CLAVEL
// @name           Share selected portal
// @category       Controls
// @version        0.1.1
// @description    Add a share link when a portal is selected

// use own namespace for plugin
window.plugin.ssp = function() {};

window.plugin.ssp.shareLink = $('<a>')
  .addClass('shareLink')
  .text('⇛');

// Append a share link in sidebar.
window.plugin.ssp.onPortalDetailsUpdated = function() {

  var portalGuid = window.selectedPortal;

  if(portalGuid == null) return;

  var data = window.portals[portalGuid].options.data;

  var lat = data.latE6 / 1E6;
  var lng = data.lngE6 / 1E6;
  var title = (data && data.title) || 'null';

  var posOnClick = window.showPortalPosLinks.bind(this, lat, lng, title);

  window.plugin.ssp.shareLink.off('click').on('click', posOnClick);

  // Prepend the share link to mobile status-bar
  $('#updatestatus').prepend(window.plugin.ssp.shareLink);

}

window.plugin.ssp.onPortalSelected = function() {
  window.plugin.ssp.shareLink.remove();
}

var setup = function() {

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    window.addHook('portalDetailsUpdated', window.plugin.ssp.onPortalDetailsUpdated);
    window.addHook('portalSelected', window.plugin.ssp.onPortalSelected);
  }

};