// @author         Mathieu CLAVEL
// @name           Share selected portal
// @category       Controls
// @version        0.1.1
// @description    Add a share link when a portal is selected

// use own namespace for plugin
window.plugin.ssp = function() {};

// Append a share link in sidebar.
window.plugin.ssp.onPortalDetailsUpdated = function() {
  $('.shareLink').remove();

  const portalGuid = window.selectedPortal;

  if(portalGuid == null) return;

  const data = window.portals[portalGuid].options.data;

  const lat = data.latE6 / 1E6;
  const lng = data.lngE6 / 1E6;
  const title = (data && data.title) || 'null';

  const posOnClick = window.showPortalPosLinks.bind(this, lat, lng, title);

  const shareLink = $('<a>', { class: 'shareLink' }).text('Share portal').click(posOnClick);

  // Prepend the share link to mobile status-bar
  $('#updatestatus').prepend(shareLink);
  $('#updatestatus .shareLink').attr('title', '');

}

const setup = function() {

  if (typeof android !== 'undefined' && android && android.intentPosLink) {
    window.addHook('portalDetailsUpdated', window.plugin.ssp.onPortalDetailsUpdated);
  }

};