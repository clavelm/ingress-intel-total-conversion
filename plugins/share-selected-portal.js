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
      .css('background-image', 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQflAhcVAAgpZfV+AAAAw0lEQVQoz3WRsQ7BYBSFj8YgdGLxDiab6EMw4QmsXqCtF7F3kngMsRiwsti1UdFK5DP4G8HfM93knuR+51zJIubExISyiwlXAFLGkmNxDORKkhoaWgx01TNjpsPvss2CJxuOJCTscIubEQEtZiScmeJQpU+fakGcAhkPUkLq/8wxb+UMbZkc8fHaU4dcgYy85ITEiAif5hekh2cgS2LGJOxNzN+iOBnsO76lycpWazPW1LH/YqWbJCnVsuyfARcu+JL0AjA1mAmE9DgjAAAAJXRFWHRkYXRlOmNyZWF0ZQAyMDIxLTAyLTIzVDIxOjAwOjA4KzAwOjAwneNzuQAAACV0RVh0ZGF0ZTptb2RpZnkAMjAyMS0wMi0yM1QyMTowMDowOCswMDowMOy+ywUAAAAZdEVYdFNvZnR3YXJlAHd3dy5pbmtzY2FwZS5vcmeb7jwaAAAAAElFTkSuQmCC")')
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