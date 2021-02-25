// @author         Mathieu CLAVEL
// @name           Share selected portal
// @category       Controls
// @version        0.1.1
// @description    Add a share link when a portal is selected

// use own namespace for plugin
window.plugin.ssp = function() {};

window.plugin.ssp.shareLink = undefined;

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

    var span = $('<span>')
      .css('background-image', 'url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeG1sbnM6c3ZnanM9Imh0dHA6Ly9zdmdqcy5jb20vc3ZnanMiIHZlcnNpb249IjEuMSIgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHg9IjAiIHk9IjAiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyIiB4bWw6c3BhY2U9InByZXNlcnZlIiBjbGFzcz0iIj48Zz48cGF0aCB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGQ9Im0zOTEgMzMyYy0yNC4xNSAwLTQ2LjEwNyA5LjU2NC02Mi4yODggMjUuMWwtOTYuMjU0LTU5LjYzM2M1LjQ5Mi0xMi43MjggOC41NDItMjYuNzQ3IDguNTQyLTQxLjQ2N3MtMy4wNS0yOC43MzktOC41NDMtNDEuNDY2bDk2LjI1NC01OS42MzNjMTYuMTgyIDE1LjUzNSAzOC4xMzkgMjUuMDk5IDYyLjI4OSAyNS4wOTkgNDkuNjI2IDAgOTAtNDAuMzc0IDkwLTkwcy00MC4zNzQtOTAtOTAtOTAtOTAgNDAuMzc0LTkwIDkwYzAgMTQuNjUxIDMuNTIxIDI4LjQ5NSA5Ljc1OCA0MC43MzJsLTk0LjAwMSA1OC4yMzhjLTE5LjI3Ni0yMy4xODQtNDguMzIxLTM3Ljk3LTgwLjc1Ny0zNy45Ny01Ny44OTcgMC0xMDUgNDcuMTAzLTEwNSAxMDVzNDcuMTAzIDEwNSAxMDUgMTA1YzMyLjQzNiAwIDYxLjQ4MS0xNC43ODYgODAuNzU3LTM3Ljk3bDk0LjAwMSA1OC4yMzhjLTYuMjM3IDEyLjIzNy05Ljc1OCAyNi4wODEtOS43NTggNDAuNzMyIDAgNDkuNjI2IDQwLjM3NCA5MCA5MCA5MHM5MC00MC4zNzQgOTAtOTAtNDAuMzc0LTkwLTkwLTkweiIgZmlsbD0iI2ZmZmZmZiIgZGF0YS1vcmlnaW5hbD0iIzAwMDAwMCIgc3R5bGU9IiIgY2xhc3M9IiIvPjwvZz48L3N2Zz4K")')
      .css('background-size', 'cover')
      .css('background-repeat', 'no-repeat')
      .css('display', 'inline-block')
      .css('float', 'left')
      .css('margin', '3px 1px 0 4px')
      .css('width', '16px')
      .css('height', '15px')
      .css('overflow', 'hidden');

    window.plugin.ssp.shareLink = $('<a>')
      .addClass('shareLink')
      .css('float', 'left')
      .css('margin', '-19px 0 0 -5px')
      .css('padding', '0 3px 1px 4px')
      .css('background', '#262c32')
      .append(span);
  }

};