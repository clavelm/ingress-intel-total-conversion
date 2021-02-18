// @author         Mathieu CLAVEL
// @name           Share selected portal
// @category       Controls
// @version        0.1.0
// @description    Add a share link when a portal is selected

/* **********************************************************************

  HOOKS:
  - pluginBkmrksEdit: fired when a bookmarks/folder is removed, added or sorted, also when a folder is opened/closed;
  - pluginBkmrksOpenOpt: fired when the "Bookmarks Options" panel is opened (you can add new options);
  - pluginBkmrksSyncEnd: fired when the sync is finished;

********************************************************************** */

// use own namespace for plugin
window.plugin.ssp = function() {
};

window.plugin.ssp.SYNC_DELAY = 5000;

window.plugin.ssp.KEY_OTHER_BKMRK = 'idOthers';
window.plugin.ssp.KEY_STORAGE = 'plugin-bookmarks';
window.plugin.ssp.KEY_STATUS_BOX = 'plugin-bookmarks-box';

window.plugin.ssp.KEY = { key: window.plugin.ssp.KEY_STORAGE, field: 'bkmrksObj' };
window.plugin.ssp.IsDefaultStorageKey = true; // as default on startup
window.plugin.ssp.UPDATE_QUEUE = { key: 'plugin-bookmarks-queue', field: 'updateQueue' };
window.plugin.ssp.UPDATING_QUEUE = { key: 'plugin-bookmarks-updating-queue', field: 'updatingQueue' };

window.plugin.ssp.bkmrksObj = {};
window.plugin.ssp.statusBox = {};
window.plugin.ssp.updateQueue = {};
window.plugin.ssp.updatingQueue = {};

window.plugin.ssp.IDcount = 0;

window.plugin.ssp.enableSync = false;

window.plugin.ssp.starLayers = {};
window.plugin.ssp.starLayerGroup = null;

window.plugin.ssp.isSmart = undefined;
window.plugin.ssp.isAndroid = function() {
  if(typeof android !== 'undefined' && android) {
    return true;
  }
  return false;
}

/*********************************************************************************************************************/

// Generate an ID for the bookmark (date time + random number)
window.plugin.ssp.generateID = function() {
  var d = new Date();
  var ID = d.getTime().toString() + window.plugin.ssp.IDcount.toString() + (Math.floor(Math.random() * 99) + 1);
  window.plugin.ssp.IDcount++;
  var ID = 'id' + ID.toString();
  return ID;
}

// Format the string
window.plugin.ssp.escapeHtml = function(text) {
  return text
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;")
  .replace(/\//g, '&#47;')
  .replace(/\\/g, '&#92;');
}

window.plugin.ssp.escapeUnicode = function(str) {
  for(var result = '', index = 0, charCode; !isNaN(charCode = str.charCodeAt(index));) {
    if((charCode & 127) == charCode) {
      result += str[ index ];
    } else {
      result += '\\u' + ('0000' + charCode.toString(16)).slice(-4);
    }
    index++;
  }
  return result;
}

// Update the localStorage
window.plugin.ssp.saveStorage = function() {
  localStorage[ plugin.ssp.KEY_STORAGE ] = JSON.stringify(window.plugin.ssp.bkmrksObj);
}

// Load the localStorage
window.plugin.ssp.loadStorage = function() {
  window.plugin.ssp.bkmrksObj = JSON.parse(localStorage[ plugin.ssp.KEY_STORAGE ]);
}

window.plugin.ssp.saveStorageBox = function() {
  localStorage[ plugin.ssp.KEY_STATUS_BOX ] = JSON.stringify(window.plugin.ssp.statusBox);
}

window.plugin.ssp.loadStorageBox = function() {
  window.plugin.ssp.statusBox = JSON.parse(localStorage[ plugin.ssp.KEY_STATUS_BOX ]);
}

window.plugin.ssp.upgradeToNewStorage = function() {
  if(localStorage[ 'plugin-bookmarks-portals-data' ] && localStorage[ 'plugin-bookmarks-maps-data' ]) {
    var oldStor_1 = JSON.parse(localStorage[ 'plugin-bookmarks-maps-data' ]);
    var oldStor_2 = JSON.parse(localStorage[ 'plugin-bookmarks-portals-data' ]);

    window.plugin.ssp.bkmrksObj.maps = oldStor_1.bkmrk_maps;
    window.plugin.ssp.bkmrksObj.portals = oldStor_2.bkmrk_portals;
    window.plugin.ssp.saveStorage();

    localStorage.removeItem('plugin-bookmarks-maps-data');
    localStorage.removeItem('plugin-bookmarks-portals-data');
    localStorage.removeItem('plugin-bookmarks-status-box');
  }
}

window.plugin.ssp.createStorage = function() {
  if(!localStorage[ window.plugin.ssp.KEY_STORAGE ]) {
    window.plugin.ssp.bkmrksObj.maps = { idOthers: { label: "Others", state: 1, bkmrk: {} } };
    window.plugin.ssp.bkmrksObj.portals = { idOthers: { label: "Others", state: 1, bkmrk: {} } };
    window.plugin.ssp.saveStorage();
  }
  if(!localStorage[ window.plugin.ssp.KEY_STATUS_BOX ]) {
    window.plugin.ssp.statusBox.show = 1;
    window.plugin.ssp.statusBox.page = 0;
    window.plugin.ssp.statusBox.pos = { x: 100, y: 100 };
    window.plugin.ssp.saveStorageBox();
  }
}

window.plugin.ssp.refreshBkmrks = function() {
  $('#bkmrk_maps > ul, #bkmrk_portals > ul').remove();

  window.plugin.ssp.loadStorage();
  window.plugin.ssp.loadList('maps');
  window.plugin.ssp.loadList('portals');

  window.plugin.ssp.updateStarPortal();
  window.plugin.ssp.jquerySortableScript();
}

/***************************************************************************************************************************************************************/

// Show/hide the bookmarks box
window.plugin.ssp.switchStatusBkmrksBox = function(status) {
  var newStatus = status;

  if(newStatus === 'switch') {
    if(window.plugin.ssp.statusBox.show === 1) {
      newStatus = 0;
    } else {
      newStatus = 1;
    }
  }

  if(newStatus === 1) {
    $('#bookmarksBox').css('height', 'auto');
    $('#bkmrksTrigger').css('height', '0');
  } else {
    $('#bkmrksTrigger').css('height', '64px');
    $('#bookmarksBox').css('height', '0');
  }

  window.plugin.ssp.statusBox[ 'show' ] = newStatus;
  window.plugin.ssp.saveStorageBox();
}

window.plugin.ssp.onPaneChanged = function(pane) {
  if(pane == "plugin-bookmarks")
    $('#bookmarksBox').css("display", "");
  else
    $('#bookmarksBox').css("display", "none");
}

// Switch list (maps/portals)
window.plugin.ssp.switchPageBkmrksBox = function(elem, page) {
  window.plugin.ssp.statusBox.page = page;
  window.plugin.ssp.saveStorageBox();

  $('h5').removeClass('current');
  $(elem).addClass('current');

  var sectList = '#' + $(elem).attr('class').replace(' current', '');
  $('#bookmarksBox .bookmarkList').removeClass('current');
  $(sectList).addClass('current');
}

// Switch the status folder to open/close (in the localStorage)
window.plugin.ssp.openFolder = function(elem) {
  $(elem).parent().parent('li').toggleClass('open');

  var typeList = $(elem).parent().parent().parent().parent('div').attr('id').replace('bkmrk_', '');
  var ID = $(elem).parent().parent('li').attr('id');

  var newFlag;
  var flag = window.plugin.ssp.bkmrksObj[ typeList ][ ID ][ 'state' ];
  if(flag) {
    newFlag = 0;
  } else if(!flag) {
    newFlag = 1;
  }

  window.plugin.ssp.bkmrksObj[ typeList ][ ID ][ 'state' ] = newFlag;
  window.plugin.ssp.saveStorage();
  window.runHooks('pluginBkmrksEdit', { "target": "folder", "action": newFlag ? "open" : "close", "id": ID });
}

// Load the HTML bookmarks
window.plugin.ssp.loadList = function(typeList) {
  var element = '';
  var elementTemp = '';
  var elementExc = '';
  var returnToMap = '';

  if(window.plugin.ssp.isSmart) {
    returnToMap = 'window.show(\'map\');';
  }

  // For each folder
  var list = window.plugin.ssp.bkmrksObj[ typeList ];

  for(var idFolders in list) {
    var folders = list[ idFolders ];
    var active = '';

    // Create a label and a anchor for the sortable
    var folderDelete = '<span class="folderLabel"><a class="bookmarksRemoveFrom" onclick="window.plugin.ssp.removeElement(this, \'folder\');return false;" title="Remove this folder">X</a>';
    var folderName = '<a class="bookmarksAnchor" onclick="window.plugin.ssp.openFolder(this);return false"><span></span>' + folders[ 'label' ] + '</a></span>';//<span><span></span></span>';
    var folderLabel = folderDelete + folderName;

    if(folders[ 'state' ]) {
      active = ' open';
    }
    if(idFolders === window.plugin.ssp.KEY_OTHER_BKMRK) {
      folderLabel = '';
      active = ' othersBookmarks open';
    }
    // Create a folder
    elementTemp = '<li class="bookmarkFolder' + active + '" id="' + idFolders + '">' + folderLabel + '<ul>';

    // For each bookmark
    var fold = folders[ 'bkmrk' ];
    for(var idBkmrk in fold) {
      var btn_link;
      var btn_remove = '<a class="bookmarksRemoveFrom" onclick="window.plugin.ssp.removeElement(this, \'' + typeList + '\');return false;" title="Remove from bookmarks">X</a>';

      var btn_move = '';
      if(window.plugin.ssp.isSmart) {
        btn_move = '<a class="bookmarksMoveIn" onclick="window.plugin.ssp.dialogMobileSort(\'' + typeList + '\', this);return false;">=</a>';
      }

      var bkmrk = fold[ idBkmrk ];
      var label = bkmrk[ 'label' ];
      var latlng = bkmrk[ 'latlng' ];

      // If it's a map
      if(typeList === 'maps') {
        if(bkmrk[ 'label' ] == '') {
          label = bkmrk[ 'latlng' ] + ' [' + bkmrk[ 'z' ] + ']';
        }
        btn_link = '<a class="bookmarksLink" onclick="' + returnToMap + 'window.map.setView([' + latlng + '], ' + bkmrk[ 'z' ] + ');return false;">' + label + '</a>';
      }
      // If it's a portal
      else if(typeList === 'portals') {
        var guid = bkmrk[ 'guid' ];
        var btn_link = '<a class="bookmarksLink" onclick="$(\'a.bookmarksLink.selected\').removeClass(\'selected\');' + returnToMap + 'window.zoomToAndShowPortal(\'' + guid + '\', [' + latlng + ']);return false;">' + label + '</a>';
      }
      // Create the bookmark
      elementTemp += '<li class="bkmrk" id="' + idBkmrk + '">' + btn_remove + btn_move + btn_link + '</li>';
    }
    elementTemp += '</li></ul>';

    // Add folder 'Others' in last position
    if(idFolders != window.plugin.ssp.KEY_OTHER_BKMRK) {
      element += elementTemp;
    } else {
      elementExc = elementTemp;
    }
  }
  element += elementExc;
  element = '<ul>' + element + '</ul>';

  // Append all folders and bookmarks
  $('#bkmrk_' + typeList).append(element);
}

/***************************************************************************************************************************************************************/

window.plugin.ssp.findByGuid = function(guid) {
  var list = window.plugin.ssp.bkmrksObj[ 'portals' ];

  for(var idFolders in list) {
    for(var idBkmrk in list[ idFolders ][ 'bkmrk' ]) {
      var portalGuid = list[ idFolders ][ 'bkmrk' ][ idBkmrk ][ 'guid' ];
      if(guid === portalGuid) {
        return { "id_folder": idFolders, "id_bookmark": idBkmrk };
      }
    }
  }
  return;
}

// Append a 'star' flag in sidebar.
window.plugin.ssp.onPortalSelectedPending = false;
window.plugin.ssp.onPortalSelected = function() {
  $('.bkmrksStar').remove();

  if(window.selectedPortal == null) return;

  if(!window.plugin.ssp.onPortalSelectedPending) {
    window.plugin.ssp.onPortalSelectedPending = true;

    setTimeout(function() { // the sidebar is constructed after firing the hook
      window.plugin.ssp.onPortalSelectedPending = false;

      $('.bkmrksStar').remove();

      if(typeof (Storage) === "undefined") {
        $('#portaldetails > .imgpreview').after(plugin.ssp.htmlDisabledMessage);
        return;
      }

      // Prepend a star to mobile status-bar
      if(window.plugin.ssp.isSmart) {
        $('#updatestatus').prepend(plugin.ssp.htmlStar);
        $('#updatestatus .bkmrksStar').attr('title', '');
      }

      $('#portaldetails > h3.title').prepend(plugin.ssp.htmlStar);
      window.plugin.ssp.updateStarPortal();
    }, 0);
  }

}

// Update the status of the star (when a portal is selected from the map/bookmarks-list)
window.plugin.ssp.updateStarPortal = function() {
  var guid = window.selectedPortal;
  $('.bkmrksStar').removeClass('favorite');
  $('.bkmrk a.bookmarksLink.selected').removeClass('selected');

  // If current portal is into bookmarks: select bookmark portal from portals list and select the star
  if(localStorage[ window.plugin.ssp.KEY_STORAGE ].search(guid) != -1) {
    var bkmrkData = window.plugin.ssp.findByGuid(guid);
    if(bkmrkData) {
      $('.bkmrk#' + bkmrkData[ 'id_bookmark' ] + ' a.bookmarksLink').addClass('selected');
      $('.bkmrksStar').addClass('favorite');
    }
  }
}

// Switch the status of the star
window.plugin.ssp.switchStarPortal = function(guid) {
  if(guid == undefined) guid = window.selectedPortal;

  // If portal is saved in bookmarks: Remove this bookmark
  var bkmrkData = window.plugin.ssp.findByGuid(guid);
  if(bkmrkData) {
    var list = window.plugin.ssp.bkmrksObj[ 'portals' ];
    delete list[ bkmrkData[ 'id_folder' ] ][ 'bkmrk' ][ bkmrkData[ 'id_bookmark' ] ];
    $('.bkmrk#' + bkmrkData[ 'id_bookmark' ] + '').remove();

    window.plugin.ssp.saveStorage();
    window.plugin.ssp.updateStarPortal();

    window.runHooks('pluginBkmrksEdit', {
      "target": "portal",
      "action": "remove",
      "folder": bkmrkData[ 'id_folder' ],
      "id"    : bkmrkData[ 'id_bookmark' ],
      "guid"  : guid
    });
    console.log('BOOKMARKS: removed portal (' + bkmrkData[ 'id_bookmark' ] + ' situated in ' + bkmrkData[ 'id_folder' ] + ' folder)');
  }
  // If portal isn't saved in bookmarks: Add this bookmark
  else {
    // Get portal name and coordinates
    var p = window.portals[ guid ];
    var ll = p.getLatLng();
    plugin.ssp.addPortalBookmark(guid, ll.lat + ',' + ll.lng, p.options.data.title);
  }
}

plugin.ssp.addPortalBookmark = function(guid, latlng, label) {
  var ID = window.plugin.ssp.generateID();

  // Add bookmark in the localStorage
  window.plugin.ssp.bkmrksObj[ 'portals' ][ window.plugin.ssp.KEY_OTHER_BKMRK ][ 'bkmrk' ][ ID ] = {
    "guid"  : guid,
    "latlng": latlng,
    "label" : label
  };

  window.plugin.ssp.saveStorage();
  window.plugin.ssp.refreshBkmrks();
  window.runHooks('pluginBkmrksEdit', { "target": "portal", "action": "add", "id": ID, "guid": guid });
  console.log('BOOKMARKS: added portal ' + ID);
}

// Add BOOKMARK/FOLDER
window.plugin.ssp.addElement = function(elem, type) {
  var ID = window.plugin.ssp.generateID();
  var typeList = $(elem).parent().parent('div').attr('id');

  // Get the label | Convert some characters | Set the input (empty)
  var input = '#' + typeList + ' .addForm input';
  var label = $(input).val();
  label = window.plugin.ssp.escapeHtml(label);
  $(input).val('');

  // Add a map
  if(type === 'map') {
    // Get the coordinates and zoom
    var c = map.getCenter();
    var lat = Math.round(c.lat * 1E6) / 1E6;
    var lng = Math.round(c.lng * 1E6) / 1E6;
    var latlng = lat + ',' + lng;
    var zoom = parseInt(map.getZoom());
    // Add bookmark in the localStorage
    window.plugin.ssp.bkmrksObj[ 'maps' ][ plugin.ssp.KEY_OTHER_BKMRK ][ 'bkmrk' ][ ID ] = {
      "label" : label,
      "latlng": latlng,
      "z"     : zoom
    };
  } else {
    if(label === '') {
      label = 'Folder';
    }
    var short_type = typeList.replace('bkmrk_', '');
    // Add new folder in the localStorage
    window.plugin.ssp.bkmrksObj[ short_type ][ ID ] = { "label": label, "state": 1, "bkmrk": {} };
  }
  window.plugin.ssp.saveStorage();
  window.plugin.ssp.refreshBkmrks();
  window.runHooks('pluginBkmrksEdit', { "target": type, "action": "add", "id": ID });
  console.log('BOOKMARKS: added ' + type + ' ' + ID);
}

// Remove BOOKMARK/FOLDER
window.plugin.ssp.removeElement = function(elem, type) {
  if(type === 'maps' || type === 'portals') {
    var typeList = $(elem).parent().parent().parent().parent().parent('div').attr('id');
    var ID = $(elem).parent('li').attr('id');
    var IDfold = $(elem).parent().parent().parent('li').attr('id');
    var guid = window.plugin.ssp.bkmrksObj[ typeList.replace('bkmrk_', '') ][ IDfold ][ 'bkmrk' ][ ID ].guid;

    delete window.plugin.ssp.bkmrksObj[ typeList.replace('bkmrk_', '') ][ IDfold ][ 'bkmrk' ][ ID ];
    $(elem).parent('li').remove();

    if(type === 'portals') {
      var list = window.plugin.ssp.bkmrksObj[ 'portals' ];

      window.plugin.ssp.updateStarPortal();
      window.plugin.ssp.saveStorage();

      window.runHooks('pluginBkmrksEdit', {
        "target": "portal",
        "action": "remove",
        "folder": IDfold,
        "id"    : ID,
        "guid"  : guid
      });
      console.log('BOOKMARKS: removed portal (' + ID + ' situated in ' + IDfold + ' folder)');
    } else {
      window.plugin.ssp.saveStorage();
      window.runHooks('pluginBkmrksEdit', { "target": "map", "action": "remove", "id": ID });
      console.log('BOOKMARKS: removed map ' + ID);
    }
  } else if(type === 'folder') {
    var typeList = $(elem).parent().parent().parent().parent('div').attr('id');
    var ID = $(elem).parent().parent('li').attr('id');

    delete plugin.ssp.bkmrksObj[ typeList.replace('bkmrk_', '') ][ ID ];
    $(elem).parent().parent('li').remove();
    window.plugin.ssp.saveStorage();
    window.plugin.ssp.updateStarPortal();
    window.runHooks('pluginBkmrksEdit', { "target": "folder", "action": "remove", "id": ID });
    console.log('BOOKMARKS: removed folder ' + ID);
  }
}

window.plugin.ssp.deleteMode = function() {
  $('#bookmarksBox').removeClass('moveMode').toggleClass('deleteMode');
}

window.plugin.ssp.moveMode = function() {
  $('#bookmarksBox').removeClass('deleteMode').toggleClass('moveMode');
}

window.plugin.ssp.mobileSortIDb = '';
window.plugin.ssp.mobileSortIDf = '';
window.plugin.ssp.dialogMobileSort = function(type, elem) {
  window.plugin.ssp.mobileSortIDb = $(elem).parent('li.bkmrk').attr('id');
  window.plugin.ssp.mobileSortIDf = $(elem).parent('li.bkmrk').parent('ul').parent('li.bookmarkFolder').attr('id');

  if(type === 'maps') {
    type = 1;
  } else if(type === 'portals') {
    type = 2;
  }

  dialog({
    html       : window.plugin.ssp.dialogLoadListFolders('bookmarksDialogMobileSort', 'window.plugin.ssp.mobileSort', true, type),
    dialogClass: 'ui-dialog-bkmrksSet-copy',
    id         : 'plugin-bookmarks-move-bookmark',
    title      : 'Bookmarks - Move Bookmark'
  });
}

window.plugin.ssp.mobileSort = function(elem) {
  var type = $(elem).data('type');
  var idBkmrk = window.plugin.ssp.mobileSortIDb;
  var newFold = $(elem).data('id');
  var oldFold = window.plugin.ssp.mobileSortIDf;

  var Bkmrk = window.plugin.ssp.bkmrksObj[ type ][ oldFold ].bkmrk[ idBkmrk ];

  delete window.plugin.ssp.bkmrksObj[ type ][ oldFold ].bkmrk[ idBkmrk ];

  window.plugin.ssp.bkmrksObj[ type ][ newFold ].bkmrk[ idBkmrk ] = Bkmrk;

  window.plugin.ssp.saveStorage();
  window.plugin.ssp.refreshBkmrks();
  window.runHooks('pluginBkmrksEdit', { "target": "bookmarks", "action": "sort" });
  window.plugin.ssp.mobileSortIDf = newFold;
  console.log('Move Bookmarks ' + type + ' ID:' + idBkmrk + ' from folder ID:' + oldFold + ' to folder ID:' + newFold);
}

window.plugin.ssp.onSearch = function(query) {
  var term = query.term.toLowerCase();

  $.each(plugin.ssp.bkmrksObj.maps, function(id, folder) {
    $.each(folder.bkmrk, function(id, bookmark) {
      if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

      query.addResult({
        title      : escapeHtmlSpecialChars(bookmark.label),
        description: 'Map in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
        icon       : '@include_img:images/icon-bookmark-map.png@',
        position   : L.latLng(bookmark.latlng.split(",")),
        zoom       : bookmark.z,
        onSelected : window.plugin.ssp.onSearchResultSelected,
      });
    });
  });

  $.each(plugin.ssp.bkmrksObj.portals, function(id, folder) {
    $.each(folder.bkmrk, function(id, bookmark) {
      if(bookmark.label.toLowerCase().indexOf(term) === -1) return;

      query.addResult({
        title      : escapeHtmlSpecialChars(bookmark.label),
        description: 'Bookmark in folder "' + escapeHtmlSpecialChars(folder.label) + '"',
        icon       : '@include_img:images/icon-bookmark.png@',
        position   : L.latLng(bookmark.latlng.split(",")),
        guid       : bookmark.guid,
        onSelected : window.plugin.ssp.onSearchResultSelected,
      });
    });
  });
};

window.plugin.ssp.onSearchResultSelected = function(result, event) {
  if(result.guid) { // portal
    var guid = result.guid;
    if(event.type == 'dblclick')
      zoomToAndShowPortal(guid, result.position);
    else if(window.portals[ guid ])
      renderPortalDetails(guid);
    else
      window.selectPortalByLatLng(result.position);
  } else if(result.zoom) { // map
    map.setView(result.position, result.zoom);
  }
  return true; // prevent default behavior
};

/***************************************************************************************************************************************************************/

// Saved the new sort of the folders (in the localStorage)
window.plugin.ssp.sortFolder = function(typeList) {
  var keyType = typeList.replace('bkmrk_', '');

  var newArr = {};
  $('#' + typeList + ' li.bookmarkFolder').each(function() {
    var idFold = $(this).attr('id');
    newArr[ idFold ] = window.plugin.ssp.bkmrksObj[ keyType ][ idFold ];
  });
  window.plugin.ssp.bkmrksObj[ keyType ] = newArr;
  window.plugin.ssp.saveStorage();

  window.runHooks('pluginBkmrksEdit', { "target": "folder", "action": "sort" });
  console.log('BOOKMARKS: sorted folder');
}

// Saved the new sort of the bookmarks (in the localStorage)
window.plugin.ssp.sortBookmark = function(typeList) {
  var keyType = typeList.replace('bkmrk_', '');
  var list = window.plugin.ssp.bkmrksObj[ keyType ];
  var newArr = {};

  $('#' + typeList + ' li.bookmarkFolder').each(function() {
    var idFold = $(this).attr('id');
    newArr[ idFold ] = window.plugin.ssp.bkmrksObj[ keyType ][ idFold ];
    newArr[ idFold ].bkmrk = {};
  });

  $('#' + typeList + ' li.bkmrk').each(function() {
    window.plugin.ssp.loadStorage();

    var idFold = $(this).parent().parent('li').attr('id');
    var id = $(this).attr('id');

    var list = window.plugin.ssp.bkmrksObj[ keyType ];
    for(var idFoldersOrigin in list) {
      for(var idBkmrk in list[ idFoldersOrigin ][ 'bkmrk' ]) {
        if(idBkmrk == id) {
          newArr[ idFold ].bkmrk[ id ] = window.plugin.ssp.bkmrksObj[ keyType ][ idFoldersOrigin ].bkmrk[ id ];
        }
      }
    }
  });
  window.plugin.ssp.bkmrksObj[ keyType ] = newArr;
  window.plugin.ssp.saveStorage();
  window.runHooks('pluginBkmrksEdit', { "target": "bookmarks", "action": "sort" });
  console.log('BOOKMARKS: sorted bookmark (portal/map)');
}

window.plugin.ssp.jquerySortableScript = function() {
  $(".bookmarkList > ul").sortable({
    items               : "li.bookmarkFolder:not(.othersBookmarks)",
    handle              : ".bookmarksAnchor",
    placeholder         : "sortable-placeholder",
    helper              : 'clone', // fix accidental click in firefox
    forcePlaceholderSize: true,
    update              : function(event, ui) {
      var typeList = ui.item.parent().parent('.bookmarkList').attr('id');
      window.plugin.ssp.sortFolder(typeList);
    }
  });

  $(".bookmarkList ul li ul").sortable({
    items               : "li.bkmrk",
    connectWith         : ".bookmarkList ul ul",
    handle              : ".bookmarksLink",
    placeholder         : "sortable-placeholder",
    helper              : 'clone', // fix accidental click in firefox
    forcePlaceholderSize: true,
    update              : function(event, ui) {
      var typeList = ui.item.parent().parent().parent().parent('.bookmarkList').attr('id');
      window.plugin.ssp.sortBookmark(typeList);
    }
  });
}

/***************************************************************************************************************************************************************/
/** OPTIONS ****************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
// Manual import, export and reset data
window.plugin.ssp.manualOpt = function() {
  dialog({
    html       : plugin.ssp.htmlSetbox,
    dialogClass: 'ui-dialog-bkmrksSet',
    id         : 'plugin-bookmarks-options',
    title      : 'Bookmarks Options'
  });

  window.runHooks('pluginBkmrksOpenOpt');
}

window.plugin.ssp.optAlert = function(message) {
  $('.ui-dialog-bkmrksSet .ui-dialog-buttonset').prepend('<p class="bkrmks-alert" style="float:left;margin-top:4px;">' + message + '</p>');
  $('.bkrmks-alert').delay(2500).fadeOut();
}

window.plugin.ssp.optCopy = function() {
  if(typeof android !== 'undefined' && android && android.shareString) {
    return android.shareString(window.plugin.ssp.escapeUnicode(localStorage[ window.plugin.ssp.KEY_STORAGE ]));
  } else {
    dialog({
      html       : '<p><a onclick="$(\'.ui-dialog-bkmrksSet-copy textarea\').select();">Select all</a> and press CTRL+C to copy it.</p><textarea readonly>' + window.plugin.ssp.escapeUnicode(localStorage[ window.plugin.ssp.KEY_STORAGE ]) + '</textarea>',
      dialogClass: 'ui-dialog-bkmrksSet-copy',
      id         : 'plugin-bookmarks-export',
      title      : 'Bookmarks Export'
    });
  }
}

window.plugin.ssp.optExport = function() {
  var data = localStorage[ window.plugin.ssp.KEY_STORAGE ];
  window.saveFile(data, 'IITC-bookmarks.json', 'application/json');
}

window.plugin.ssp.optPaste = function() {
  var promptAction = prompt('Press CTRL+V to paste it.', '');
  if(promptAction !== null && promptAction !== '') {
    try {
      JSON.parse(promptAction); // try to parse JSON first
      localStorage[ window.plugin.ssp.KEY_STORAGE ] = promptAction;
      window.plugin.ssp.refreshBkmrks();
      window.runHooks('pluginBkmrksEdit', { "target": "all", "action": "import" });
      console.log('BOOKMARKS: reset and imported bookmarks');
      window.plugin.ssp.optAlert('Successful. ');
    } catch(e) {
      console.warn('BOOKMARKS: failed to import data: ' + e);
      window.plugin.ssp.optAlert('<span style="color: #f88">Import failed </span>');
    }
  }
}

window.plugin.ssp.optImport = function() {
  L.FileListLoader.loadFiles({ accept: 'application/json' })
  .on('load', function(e) {
    try {
      JSON.parse(e.reader.result); // try to parse JSON first
      localStorage[ window.plugin.ssp.KEY_STORAGE ] = e.reader.result;
      window.plugin.ssp.refreshBkmrks();
      window.runHooks('pluginBkmrksEdit', { "target": "all", "action": "import" });
      console.log('BOOKMARKS: reset and imported bookmarks');
      window.plugin.ssp.optAlert('Successful. ');
    } catch(e) {
      console.warn('BOOKMARKS: failed to import data: ' + e);
      window.plugin.ssp.optAlert('<span style="color: #f88">Import failed </span>');
    }
  });
}

window.plugin.ssp.optReset = function() {
  var promptAction = confirm('All bookmarks will be deleted. Are you sure?', '');
  if(promptAction) {
    delete localStorage[ window.plugin.ssp.KEY_STORAGE ];
    window.plugin.ssp.createStorage();
    window.plugin.ssp.loadStorage();
    window.plugin.ssp.refreshBkmrks();
    window.runHooks('pluginBkmrksEdit', { "target": "all", "action": "reset" });
    console.log('BOOKMARKS: reset all bookmarks');
    window.plugin.ssp.optAlert('Successful. ');
  }
}

window.plugin.ssp.optBox = function(command) {
  if(!window.plugin.ssp.isAndroid()) {
    switch(command) {
      case 'save':
        var boxX = parseInt($('#bookmarksBox').css('top'));
        var boxY = parseInt($('#bookmarksBox').css('left'));
        window.plugin.ssp.statusBox.pos = { x: boxX, y: boxY };
        window.plugin.ssp.saveStorageBox();
        window.plugin.ssp.optAlert('Position acquired. ');
        break;
      case 'reset':
        $('#bookmarksBox').css({ 'top': 100, 'left': 100 });
        window.plugin.ssp.optBox('save');
        break;
    }
  } else {
    window.plugin.ssp.optAlert('Only IITC desktop. ');
  }
}

window.plugin.ssp.dialogLoadListFolders = function(idBox, clickAction, showOthersF, scanType/*0 = maps&portals; 1 = maps; 2 = portals*/) {
  var list = JSON.parse(localStorage[ window.plugin.ssp.KEY_STORAGE ]);
  var listHTML = '';
  var foldHTML = '';
  var elemGenericFolder = '';

  // For each type and folder
  for(var type in list) {
    if(scanType === 0 || (scanType === 1 && type === 'maps') || (scanType === 2 && type === 'portals')) {
      listHTML += '<h3>' + type + ':</h3>';

      for(var idFolders in list[ type ]) {
        var label = list[ type ][ idFolders ][ 'label' ];

        // Create a folder
        foldHTML = '<div class="bookmarkFolder" id="' + idFolders + '" data-type="' + type + '" data-id="' + idFolders + '" onclick="' + clickAction + '(this)";return false;">' + label + '</div>';

        if(idFolders !== window.plugin.ssp.KEY_OTHER_BKMRK) {
          listHTML += foldHTML;
        } else {
          if(showOthersF === true) {
            elemGenericFolder = foldHTML;
          }
        }
      }
    }
    listHTML += elemGenericFolder;
    elemGenericFolder = '';
  }

  // Append all folders
  var r = '<div class="bookmarksDialog" id="' + idBox + '">'
    + listHTML
    + '</div>';

  return r;
}

window.plugin.ssp.renameFolder = function(elem) {
  var type = $(elem).data('type');
  var idFold = $(elem).data('id');

  var promptAction = prompt('Insert a new name.', '');
  if(promptAction !== null && promptAction !== '') {
    try {
      var newName = window.plugin.ssp.escapeHtml(promptAction);

      window.plugin.ssp.bkmrksObj[ type ][ idFold ].label = newName;
      $('#bookmarksDialogRenameF #' + idFold).text(newName);
      window.plugin.ssp.saveStorage();
      window.plugin.ssp.refreshBkmrks();
      window.runHooks('pluginBkmrksEdit', { "target": "all", "action": "import" });

      console.log('BOOKMARKS: renamed bookmarks folder');
      window.plugin.ssp.optAlert('Successful. ');
    } catch(e) {
      console.warn('BOOKMARKS: failed to rename folder: ' + e);
      window.plugin.ssp.optAlert('<span style="color: #f88">Rename failed </span>');
      return;
    }
  }
}

window.plugin.ssp.optRenameF = function() {
  dialog({
    html       : window.plugin.ssp.dialogLoadListFolders('bookmarksDialogRenameF', 'window.plugin.ssp.renameFolder', false, 0),
    dialogClass: 'ui-dialog-bkmrksSet-copy',
    id         : 'plugin-bookmarks-rename-folder',
    title      : 'Bookmarks Rename Folder'
  });
}

/***************************************************************************************************************************************************************/
/** AUTO DRAW **************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
window.plugin.ssp.dialogDrawer = function() {
  dialog({
    html       : window.plugin.ssp.dialogLoadList,
    dialogClass: 'ui-dialog-autodrawer',
    id         : 'plugin-bookmarks-move-bookmark',
    title      : 'Bookmarks - Auto Draw',
    buttons    : {
      'DRAW'     : function() {
        window.plugin.ssp.draw(0);
      },
      'DRAW&VIEW': function() {
        window.plugin.ssp.draw(1);
      }
    }
  });
  window.plugin.ssp.autoDrawOnSelect();
}

window.plugin.ssp.draw = function(view) {
  var latlngs = [];
  var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
    var tt = $(this).data('latlng');
    latlngs[ i ] = tt;
  });

  if(latlngs.length >= 2 && latlngs.length <= 3) {
    // TODO: add an API to draw-tools rather than assuming things about its internals

    var layer, layerType;
    if(latlngs.length == 2) {
      layer = L.geodesicPolyline(latlngs, window.plugin.drawTools.lineOptions);
      layerType = 'polyline';
    } else {
      layer = L.geodesicPolygon(latlngs, window.plugin.drawTools.polygonOptions);
      layerType = 'polygon';
    }

    map.fire('draw:created', {
      layer    : layer,
      layerType: layerType
    });

    if($('#bkmrkClearSelection').prop('checked'))
      $('#bkmrksAutoDrawer a.bkmrk.selected').removeClass('selected');

    if(window.plugin.ssp.isSmart) {
      window.show('map');
    }

    // Shown the layer if it is hidden
    if(!map.hasLayer(window.plugin.drawTools.drawnItems)) {
      map.addLayer(window.plugin.drawTools.drawnItems);
    }

    if(view) {
      map.fitBounds(layer.getBounds());
    }
  }
}

window.plugin.ssp.autoDrawOnSelect = function() {
  var latlngs = [];
  var uuu = $('#bkmrksAutoDrawer a.bkmrk.selected').each(function(i) {
    var tt = $(this).data('latlng');
    latlngs[ i ] = tt;
  });

  var text = "You must select 2 or 3 portals!";
  var color = "red";

  function formatDistance(distance) {
    var text = digits(distance > 10000 ? (distance / 1000).toFixed(2) + "km" : (Math.round(distance) + "m"));
    return distance >= 200000
      ? '<em title="Long distance link" class="help longdistance">' + text + '</em>'
      : text;
  }

  if(latlngs.length == 2) {
    var distance = L.latLng(latlngs[ 0 ]).distanceTo(latlngs[ 1 ]);
    text = 'Distance between portals: ' + formatDistance(distance);
    color = "";
  } else if(latlngs.length == 3) {
    var longdistance = false;
    var distances = latlngs.map(function(ll1, i, latlngs) {
      var ll2 = latlngs[ (i + 1) % 3 ];
      return formatDistance(L.latLng(ll1).distanceTo(ll2));
    });
    text = 'Distances: ' + distances.join(", ");
    color = "";
  }

  $('#bkmrksAutoDrawer p')
  .html(text)
  .css("color", color);
}

window.plugin.ssp.dialogLoadList = function() {
  var r = 'The "<a href="' + '@url_homepage@' + '" target="_BLANK"><strong>Draw Tools</strong></a>" plugin is required.</span>';

  if(!window.plugin.ssp || !window.plugin.drawTools) {
    $('.ui-dialog-autodrawer .ui-dialog-buttonset .ui-button:not(:first)').hide();
  } else {
    var portalsList = JSON.parse(localStorage[ window.plugin.ssp.KEY_STORAGE ]);
    var element = '';
    var elementTemp = '';
    var elemGenericFolder = '';

    // For each folder
    var list = portalsList.portals;
    for(var idFolders in list) {
      var folders = list[ idFolders ];

      // Create a label and a anchor for the sortable
      var folderLabel = '<a class="folderLabel" onclick="$(this).siblings(\'div\').toggle();return false;">' + folders[ 'label' ] + '</a>';

      // Create a folder
      elementTemp = '<div class="bookmarkFolder" id="' + idFolders + '">' + folderLabel + '<div>';

      // For each bookmark
      var fold = folders[ 'bkmrk' ];
      for(var idBkmrk in fold) {
        var bkmrk = fold[ idBkmrk ];
        var label = bkmrk[ 'label' ];
        var latlng = bkmrk[ 'latlng' ];

        // Create the bookmark
        elementTemp += '<a class="bkmrk" id="' + idBkmrk + '" onclick="$(this).toggleClass(\'selected\');return false" data-latlng="[' + latlng + ']">' + label + '</a>';
      }
      elementTemp += '</div></div>';

      if(idFolders !== window.plugin.ssp.KEY_OTHER_BKMRK) {
        element += elementTemp;
      } else {
        elemGenericFolder += elementTemp;
      }
    }
    element += elemGenericFolder;

    // Append all folders and bookmarks
    r = '<div id="bkmrksAutoDrawer">'
      + '<label style="margin-bottom: 9px; display: block;">'
      + '<input style="vertical-align: middle;" type="checkbox" id="bkmrkClearSelection" checked>'
      + ' Clear selection after drawing</label>'
      + '<p style="margin-bottom:9px;color:red">You must select 2 or 3 portals!</p>'
      + '<div onclick="window.plugin.ssp.autoDrawOnSelect();return false;">'
      + element
      + '</div>'
      + '</div>';
  }
  return r;
}

/***************************************************************************************************************************************************************/
/** SYNC *******************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
// Delay the syncing to group a few updates in a single request
window.plugin.ssp.delaySync = function() {
  if(!window.plugin.ssp.enableSync || !window.plugin.ssp.IsDefaultStorageKey) return;
  clearTimeout(plugin.ssp.delaySync.timer);
  window.plugin.ssp.delaySync.timer = setTimeout(function() {
    window.plugin.ssp.delaySync.timer = null;
    window.plugin.ssp.syncNow();
  }, window.plugin.ssp.SYNC_DELAY);
}

// Store the updateQueue in updatingQueue and upload
window.plugin.ssp.syncNow = function() {
  if(!window.plugin.ssp.enableSync || !window.plugin.ssp.IsDefaultStorageKey) return;
  $.extend(window.plugin.ssp.updatingQueue, window.plugin.ssp.updateQueue);
  window.plugin.ssp.updateQueue = {};
  window.plugin.ssp.storeLocal(window.plugin.ssp.UPDATING_QUEUE);
  window.plugin.ssp.storeLocal(window.plugin.ssp.UPDATE_QUEUE);

  window.plugin.sync.updateMap('bookmarks', window.plugin.ssp.KEY.field, Object.keys(window.plugin.ssp.updatingQueue));
}

// Call after IITC and all plugin loaded
window.plugin.ssp.registerFieldForSyncing = function() {
  if(!window.plugin.sync) return;
  window.plugin.sync.registerMapForSync('bookmarks', window.plugin.ssp.KEY.field, window.plugin.ssp.syncCallback, window.plugin.ssp.syncInitialized);
}

// Call after local or remote change uploaded
window.plugin.ssp.syncCallback = function(pluginName, fieldName, e, fullUpdated) {
  if(fieldName === window.plugin.ssp.KEY.field) {
    window.plugin.ssp.storeLocal(window.plugin.ssp.KEY);
    // All data is replaced if other client update the data during this client offline,
    if(fullUpdated) {
      window.plugin.ssp.refreshBkmrks();
      window.plugin.ssp.resetAllStars();
      console.log('BOOKMARKS: synchronized all after offline');
      return;
    }

    if(!e) return;
    if(e.isLocal) {
      // Update pushed successfully, remove it from updatingQueue
      delete window.plugin.ssp.updatingQueue[ e.property ];
    } else {
      // Remote update
      delete window.plugin.ssp.updateQueue[ e.property ];
      window.plugin.ssp.storeLocal(window.plugin.ssp.UPDATE_QUEUE);
      window.plugin.ssp.refreshBkmrks();
      window.plugin.ssp.resetAllStars();
      window.runHooks('pluginBkmrksSyncEnd', { "target": "all", "action": "sync" });
      console.log('BOOKMARKS: synchronized all from remote');
    }
  }
}

// syncing of the field is initialized, upload all queued update
window.plugin.ssp.syncInitialized = function(pluginName, fieldName) {
  if(fieldName === window.plugin.ssp.KEY.field) {
    window.plugin.ssp.enableSync = true;
    if(Object.keys(window.plugin.ssp.updateQueue).length > 0) {
      window.plugin.ssp.delaySync();
    }
  }
}

window.plugin.ssp.storeLocal = function(mapping) {
  if(typeof (window.plugin.ssp[ mapping.field ]) !== 'undefined' && window.plugin.ssp[ mapping.field ] !== null) {
    localStorage[ mapping.key ] = JSON.stringify(window.plugin.ssp[ mapping.field ]);
  } else {
    localStorage.removeItem(mapping.key);
  }
}

window.plugin.ssp.loadLocal = function(mapping) {
  var objectJSON = localStorage[ mapping.key ];
  if(!objectJSON) return;
  window.plugin.ssp[ mapping.field ] = mapping.convertFunc
    ? mapping.convertFunc(JSON.parse(objectJSON))
    : JSON.parse(objectJSON);
}

window.plugin.ssp.syncBkmrks = function() {
  window.plugin.ssp.loadLocal(window.plugin.ssp.KEY);

  window.plugin.ssp.updateQueue = window.plugin.ssp.bkmrksObj;
  window.plugin.ssp.storeLocal(window.plugin.ssp.UPDATE_QUEUE);

  window.plugin.ssp.delaySync();
  window.plugin.ssp.loadLocal(window.plugin.ssp.KEY);    // switch back to active storage related to KEY
}

/***************************************************************************************************************************************************************/
/** HIGHLIGHTER ************************************************************************************************************************************************/
/***************************************************************************************************************************************************************/
window.plugin.ssp.highlight = function(data) {
  var guid = data.portal.options.ent[ 0 ];
  if(window.plugin.ssp.findByGuid(guid)) {
    data.portal.setStyle({ fillColor: 'red' });
  }
}

window.plugin.ssp.highlightRefresh = function(data) {
  if(_current_highlighter === 'Bookmarked Portals') {
    if(data.action === 'sync'
      || data.target === 'portal'
      || (data.target === 'folder' && data.action === 'remove')
      || (data.target === 'all' && data.action === 'import')
      || (data.target === 'all' && data.action === 'reset')
      || (data.target === 'all' && data.action === 'MPEswitch')) {
      window.changePortalHighlights('Bookmarked Portals');
    }
  }
}

/***************************************************************************************************************************************************************/
/** BOOKMARKED PORTALS LAYER ***********************************************************************************************************************************/
/***************************************************************************************************************************************************************/
window.plugin.ssp.addAllStars = function() {
  var list = window.plugin.ssp.bkmrksObj.portals;

  for(var idFolders in list) {
    for(var idBkmrks in list[ idFolders ][ 'bkmrk' ]) {
      var latlng = list[ idFolders ][ 'bkmrk' ][ idBkmrks ].latlng.split(",");
      var guid = list[ idFolders ][ 'bkmrk' ][ idBkmrks ].guid;
      var lbl = list[ idFolders ][ 'bkmrk' ][ idBkmrks ].label;
      window.plugin.ssp.addStar(guid, latlng, lbl);
    }
  }
}

window.plugin.ssp.resetAllStars = function() {
  for(guid in window.plugin.ssp.starLayers) {
    var starInLayer = window.plugin.ssp.starLayers[ guid ];
    window.plugin.ssp.starLayerGroup.removeLayer(starInLayer);
    delete window.plugin.ssp.starLayers[ guid ];
  }
  window.plugin.ssp.addAllStars();
  console.log("resetAllStars done");
}

window.plugin.ssp.addStar = function(guid, latlng, lbl) {
  var star = L.marker(latlng, {
    title: lbl,
    icon : L.icon({
      iconUrl   : '@include_img:images/marker-star.png@',
      iconAnchor: [15, 40],
      iconSize  : [30, 40]
    })
  });
  window.registerMarkerForOMS(star);
  star.on('spiderfiedclick', function() {
    renderPortalDetails(guid);
  });

  window.plugin.ssp.starLayers[ guid ] = star;
  star.addTo(window.plugin.ssp.starLayerGroup);
}

window.plugin.ssp.editStar = function(data) {
  if(data.target === 'portal') {
    if(data.action === 'add') {
      var guid = data.guid;
      var latlng = window.portals[ guid ].getLatLng();
      var lbl = window.portals[ guid ].options.data.title;
      var starInLayer = window.plugin.ssp.starLayers[ data.guid ];
      window.plugin.ssp.addStar(guid, latlng, lbl);
    } else if(data.action === 'remove') {
      var starInLayer = window.plugin.ssp.starLayers[ data.guid ];
      window.plugin.ssp.starLayerGroup.removeLayer(starInLayer);
      delete window.plugin.ssp.starLayers[ data.guid ];
    }
  } else if((data.target === 'all' && (data.action === 'import' || data.action === 'reset')) || (data.target === 'folder' && data.action === 'remove')) {
    window.plugin.ssp.resetAllStars();
  }
}

/***************************************************************************************************************************************************************/

window.plugin.ssp.setupCSS = function() {
  $('<style>').prop('type', 'text/css').html('@include_css:bookmarks.css@').appendTo('head');
}

window.plugin.ssp.setupPortalsList = function() {
  function onBookmarkChanged(data) {
    console.log(data, data.target, data.guid);

    if(data.target == "portal" && data.guid) {
      if(plugin.ssp.findByGuid(data.guid))
        $('[data-list-bookmark="' + data.guid + '"]').addClass("favorite");
      else
        $('[data-list-bookmark="' + data.guid + '"]').removeClass("favorite");
    } else {
      $('[data-list-bookmark]').each(function(i, element) {
        var guid = element.getAttribute("data-list-bookmark");
        if(plugin.ssp.findByGuid(guid))
          $(element).addClass("favorite");
        else
          $(element).removeClass("favorite");
      });
    }
  }

  window.addHook('pluginBkmrksEdit', onBookmarkChanged);
  window.addHook('pluginBkmrksSyncEnd', onBookmarkChanged);

  window.plugin.portalslist.fields.unshift({ // insert at first column
    title : "",
    value : function(portal) {
      return portal.options.guid;
    }, // we store the guid, but implement a custom comparator so the list does sort properly without closing and reopening the dialog
    sort  : function(guidA, guidB) {
      var infoA = plugin.ssp.findByGuid(guidA);
      var infoB = plugin.ssp.findByGuid(guidB);
      if(infoA && !infoB) return 1;
      if(infoB && !infoA) return -1;
      return 0;
    },
    format: function(cell, portal, guid) {
      $(cell)
      .addClass("portal-list-bookmark")
      .attr("data-list-bookmark", guid);

      // for some reason, jQuery removes event listeners when the list is sorted. Therefore we use DOM's addEventListener
      $('<span>').appendTo(cell)[ 0 ].addEventListener("click", function() {
        if(window.plugin.ssp.findByGuid(guid)) {
          window.plugin.ssp.switchStarPortal(guid);
        } else {
          var ll = portal.getLatLng();
          plugin.ssp.addPortalBookmark(guid, ll.lat + ',' + ll.lng, portal.options.data.title);
        }
      }, false);

      if(plugin.ssp.findByGuid(guid))
        cell.className += " favorite";
    },
  });
}

window.plugin.ssp.setupContent = function() {
  plugin.ssp.htmlBoxTrigger = '<a id="bkmrksTrigger" class="open" onclick="window.plugin.ssp.switchStatusBkmrksBox(\'switch\');return false;" accesskey="v" title="[v]">[-] Bookmarks</a>';
  plugin.ssp.htmlBkmrksBox = '<div id="bookmarksBox">'
    + '<div id="topBar">'
    + '<a id="bookmarksMin" class="btn" onclick="window.plugin.ssp.switchStatusBkmrksBox(0);return false;" title="Minimize">-</a>'
    + '<div class="handle">...</div>'
    + '<a id="bookmarksDel" class="btn" onclick="window.plugin.ssp.deleteMode();return false;" title="Show/Hide \'X\' button">Show/Hide "X" button</a>'
    + '</div>'
    + '<div id="bookmarksTypeBar">'
    + '<h5 class="bkmrk_maps current" onclick="window.plugin.ssp.switchPageBkmrksBox(this, 0);return false">Maps</h5>'
    + '<h5 class="bkmrk_portals" onclick="window.plugin.ssp.switchPageBkmrksBox(this, 1);return false">Portals</h5>'
    + '<div style="clear:both !important;"></div>'
    + '</div>'
    + '<div id="bkmrk_maps" class="bookmarkList current">'
    + '<div class="addForm">'
    + '<input placeholder="Insert label" />'
    + '<a class="newMap" onclick="window.plugin.ssp.addElement(this, \'map\');return false;">+ Map</a>'
    + '<a class="newFolder" onclick="window.plugin.ssp.addElement(this, \'folder\');return false;">+ Folder</a>'
    + '</div>'
    + '</div>'
    + '<div id="bkmrk_portals" class="bookmarkList">'
    + '<div class="addForm">'
    + '<input placeholder="Insert label" />'
    + '<a class="newFolder" onclick="window.plugin.ssp.addElement(this, \'folder\');return false;">+ Folder</a>'
    + '</div>'
    + '</div>'
    + '<div style="border-bottom-width:1px;"></div>'
    + '</div>';

  plugin.ssp.htmlDisabledMessage = '<div title="Your browser do not support localStorage">Plugin Bookmarks disabled*.</div>';
  plugin.ssp.htmlStar = '<a class="bkmrksStar" accesskey="b" onclick="window.plugin.ssp.switchStarPortal();return false;" title="Save this portal in your bookmarks [b]"><span></span></a>';
  plugin.ssp.htmlCalldrawBox = '<a onclick="window.plugin.ssp.dialogDrawer();return false;" accesskey="q" title="Draw lines/triangles between bookmarked portals [q]">Auto draw</a>';
  plugin.ssp.htmlCallSetBox = '<a onclick="window.plugin.ssp.manualOpt();return false;">Bookmarks Opt</a>';
  plugin.ssp.htmlMoveBtn = '<a id="bookmarksMove" class="btn" onclick="window.plugin.ssp.moveMode();return false;">Show/Hide "Move" button</a>'

  var actions = '';
  actions += '<a onclick="window.plugin.ssp.optReset();return false;">Reset bookmarks</a>';
  actions += '<a onclick="window.plugin.ssp.optCopy();return false;">Copy bookmarks</a>';
  actions += '<a onclick="window.plugin.ssp.optPaste();return false;">Paste bookmarks</a>';

  actions += '<a onclick="window.plugin.ssp.optImport();return false;">Import bookmarks</a>';
  actions += '<a onclick="window.plugin.ssp.optExport();return false;">Export bookmarks</a>';

  actions += '<a onclick="window.plugin.ssp.optRenameF();return false;">Rename Folder</a>'
  if(!plugin.ssp.isAndroid()) {
    actions += '<a onclick="window.plugin.ssp.optBox(\'save\');return false;">Save box position</a>';
    actions += '<a onclick="window.plugin.ssp.optBox(\'reset\');return false;">Reset box position</a>';
  }
  plugin.ssp.htmlSetbox = '<div id="bkmrksSetbox">' + actions + '</div>';
}

/***************************************************************************************************************************************************************/
window.plugin.ssp.initMPE = function() {
  window.plugin.mpe.setMultiProjects({
    namespace  : 'bookmarks',
    title      : 'Bookmarks for Maps and Portals',
    fa         : 'fa-bookmark',
    defaultKey : 'plugin-bookmarks',
    func_setKey: function(newKey) {
      window.plugin.ssp.KEY_STORAGE = newKey;
      window.plugin.ssp.KEY.key = newKey;
    },
    func_pre   : function() {
      //disable sync
      window.plugin.ssp.IsDefaultStorageKey = false;
    },
    func_post  : function() {
      // Delete all Markers (stared portals)
      for(var guid in window.plugin.ssp.starLayers) {
        var starInLayer = window.plugin.ssp.starLayers[ guid ];
        window.plugin.ssp.starLayerGroup.removeLayer(starInLayer);
        delete window.plugin.ssp.starLayers[ guid ];
      }
      // Create Storage if not exist
      window.plugin.ssp.createStorage();
      // Load Storage
      window.plugin.ssp.loadStorage();
      // window.plugin.ssp.saveStorage();

      // Delete and Regenerate Bookmark Lists
      window.plugin.ssp.refreshBkmrks();

      // Add Markers (stared portals)
      window.plugin.ssp.addAllStars();

      // Refresh Highlighter
      window.plugin.ssp.highlightRefresh({ "target": "all", "action": "MPEswitch" });

      // enable sync if default storage
      window.plugin.ssp.IsDefaultStorageKey = (this.defaultKey === this.currKey);
    }
  });
}

/***************************************************************************************************************************************************************/

var setup = function() {
  window.plugin.ssp.isSmart = window.isSmartphone();

  // HOOKS:
  // - pluginBkmrksEdit:    fired when a bookmarks/folder is removed, added or sorted,
  //                        also when a folder is opened/closed.
  // - pluginBkmrksOpenOpt: fired when the "Bookmarks Options" panel is opened
  //                        (you can add new options);
  // - pluginBkmrksSyncEnd: fired when the sync is finished;

  // If the storage not exists or is a old version
  window.plugin.ssp.createStorage();
  window.plugin.ssp.upgradeToNewStorage();

  // Load data from localStorage
  window.plugin.ssp.loadStorage();
  window.plugin.ssp.loadStorageBox();
  window.plugin.ssp.setupContent();
  window.plugin.ssp.setupCSS();

  if(!window.plugin.ssp.isSmart) {
    $('body').append(window.plugin.ssp.htmlBoxTrigger + window.plugin.ssp.htmlBkmrksBox);
    $('#bookmarksBox').draggable({ handle: '.handle', containment: 'window' });
    $("#bookmarksBox #bookmarksMin , #bookmarksBox ul li, #bookmarksBox ul li a, #bookmarksBox ul li a span, #bookmarksBox h5, #bookmarksBox .addForm a").disableSelection();
    $('#bookmarksBox').css({ 'top': window.plugin.ssp.statusBox.pos.x, 'left': window.plugin.ssp.statusBox.pos.y });
  } else {
    $('body').append(window.plugin.ssp.htmlBkmrksBox);
    $('#bookmarksBox').css("display", "none").addClass("mobile");

    if(window.useAndroidPanes())
      android.addPane("plugin-bookmarks", "Bookmarks", "ic_action_star");
    window.addHook('paneChanged', window.plugin.ssp.onPaneChanged);
  }
  $('#toolbox').append(window.plugin.ssp.htmlCallSetBox + window.plugin.ssp.htmlCalldrawBox);

  if(window.plugin.ssp.isSmart) {
//      $('#bookmarksBox.mobile #topBar').prepend(window.plugin.ssp.htmlCallSetBox+window.plugin.ssp.htmlCalldrawBox); // wonk in progress
    $('#bookmarksBox.mobile #topBar').append(plugin.ssp.htmlMoveBtn);
  }

  window.plugin.ssp.loadList('maps');
  window.plugin.ssp.loadList('portals');
  window.plugin.ssp.jquerySortableScript();

  if(window.plugin.ssp.statusBox[ 'show' ] === 0) {
    window.plugin.ssp.switchStatusBkmrksBox(0);
  }
  if(window.plugin.ssp.statusBox[ 'page' ] === 1) {
    $('#bookmarksBox h5.bkmrk_portals').trigger('click');
  }

  window.addHook('portalSelected', window.plugin.ssp.onPortalSelected);
  window.addHook('search', window.plugin.ssp.onSearch);

  // Sync
  window.addHook('pluginBkmrksEdit', window.plugin.ssp.syncBkmrks);
  window.plugin.ssp.registerFieldForSyncing();

  // Highlighter - bookmarked portals
  window.addHook('pluginBkmrksEdit', window.plugin.ssp.highlightRefresh);
  window.addHook('pluginBkmrksSyncEnd', window.plugin.ssp.highlightRefresh);
  window.addPortalHighlighter('Bookmarked Portals', window.plugin.ssp.highlight);

  // Layer - Bookmarked portals
  window.plugin.ssp.starLayerGroup = new L.LayerGroup();
  window.addLayerGroup('Bookmarked Portals', window.plugin.ssp.starLayerGroup, false);
  window.plugin.ssp.addAllStars();
  window.addHook('pluginBkmrksEdit', window.plugin.ssp.editStar);
  window.addHook('pluginBkmrksSyncEnd', window.plugin.ssp.resetAllStars);

  if(window.plugin.portalslist) {
    window.plugin.ssp.setupPortalsList();
  }
  // Initilaize MPE-Support only if MPE-Module is available
  if(window.plugin.mpe !== undefined) {
    window.plugin.ssp.initMPE();
  }

}