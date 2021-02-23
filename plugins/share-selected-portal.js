// @author         Mathieu CLAVEL
// @name           Share selected portal
// @category       Controls
// @version        0.1.1
// @description    Add a share link when a portal is selected

// use own namespace for plugin
window.plugin.ssp = function() {};

// Append a share link in sidebar.
window.plugin.ssp.onPortalDetailsUpdated = function() {

  var portalGuid = window.selectedPortal;

  if(portalGuid == null) return;

  var data = window.portals[portalGuid].options.data;

  var lat = data.latE6 / 1E6;
  var lng = data.lngE6 / 1E6;
  var title = (data && data.title) || 'null';

  var posOnClick = window.showPortalPosLinks.bind(this, lat, lng, title);

  var shareLink = $('<a>', { class: 'shareLink' }).text('⇛').on('click', posOnClick);

  // Prepend the share link to mobile status-bar
  $('#updatestatus').prepend(shareLink);
  $('#updatestatus .shareLink').attr('title', '');

}

window.plugin.ssp.onPortalSelected = function() {
  $('.shareLink').remove();
}

var setup = function() {

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    window.addHook('portalDetailsUpdated', window.plugin.ssp.onPortalDetailsUpdated);
    window.addHook('portalSelected', window.plugin.ssp.onPortalSelected);
  }

};