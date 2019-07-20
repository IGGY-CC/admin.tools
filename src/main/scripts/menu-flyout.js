selectTool = function(e) {
    var e = event;
    var theTool = e.target.parentNode;
    var theToolbar = document.getElementById("toolbar");
    var toolbarItems = theToolbar.getElementsByTagName("li");
  
    for (var i = 0; i < toolbarItems.length; ++i) {
      toolbarItems[i].className = '';
      // do something with items[i], which is a <li> element
    }
    
    theTool.className = 'active';
};
  