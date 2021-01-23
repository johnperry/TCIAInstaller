

module.exports = {
  fileSystemXmlToJson: function(xml, parent=""){

    /*
       <dir  name="Directory" parent="absolutePath">
         <dir name="sub-directory"/>
         <file name="file"/>
       </dir>
       */

    var obj={};

    if (xml.nodeType == 9){
      obj["children"] = [];
      for (var j = 0 ; j < xml.childNodes.length; j++){
        obj["children"].push(this.fileSystemXmlToJson(xml.childNodes.item(j)));
      }
    }
    else if (xml.attributes && xml.attributes.length > 0) {
      obj["type"] = xml.nodeName;
      obj["text"] = xml.getAttribute('name');
      if(xml.getAttribute('parent')) {
        obj["parent"] = xml.getAttribute('parent');
        obj["path"] = xml.getAttribute('parent');
        if (obj["path"] != "/")
          (obj["path"] += "/");
        obj["path"] += obj["text"];
      }
      else {
        if (parent != "/") {
          obj["path"] = parent + "/" + obj["text"];
        }
        else{
          obj["path"] = "/" + obj["text"];
        }
      }

      if (xml.nodeName == "dir") {
        obj["opened"] = true;
        //obj["icon"] = "ti-folder";
        if (xml.hasChildNodes()) {
          obj["children"] = [];
          for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            if (item.nodeName == "dir" || item.nodeName == "file") {
              try {
                //IE bombs on 'startsWith'.  Non-critical to filter out the hidden directories & files
                if (!item.getAttribute('name').startsWith('.')){
                  obj["children"].push(this.fileSystemXmlToJson(item, obj["path"]));
                }
              }
              catch (e){
                obj["children"].push(this.fileSystemXmlToJson(item, obj["path"]));
              }
            }
          }
        }
      }
      else if (xml.nodeName == "file") {
        obj["icon"] = "ti-file"
      }
    }
    return obj;
  },
  rootsXmlToJson: function(xml){
    /* <roots><root name="/" desc="null"/></roots> */

    var obj = {};
    obj["children"] = [];
    var roots = xml.getElementsByTagName("root");

    for (var i=0; i<roots.length; i++){
      var rootObj = {};
      rootObj["type"] = "dir";
      rootObj["text"] = roots[i].getAttribute('name');
      rootObj["path"] = roots[i].getAttribute('name');
      obj["children"].push(rootObj);
    }

    return obj;
  },
  importPipelineXmlToJson: function(xml, parent){
    var obj={};

    if (xml.nodeType == 9 || xml.nodeName == "DicomFiles"){
      obj["children"] = [];
      for (var j = 0 ; j < xml.childNodes.length; j++){
        obj["children"].push(this.importPipelineXmlToJson(xml.childNodes.item(j)));
      }
    }
    else if (xml.nodeName == "dir") {
      obj["type"] = xml.nodeName;
      obj["text"] = xml.getAttribute('name');
      obj["selected"] = true;
      obj["patientID"] = xml.getAttribute('PatientID');
      if(xml.getAttribute('parent')) {
        obj["parent"] = xml.getAttribute('parent');
        obj["path"] = xml.getAttribute('parent');
        if (obj["path"] != "/")
          (obj["path"] += "/");
        obj["path"] += obj["text"];
      }
      else {
        obj["path"] = parent + "/" + obj["text"];
      }

      if (xml.getAttribute('name').match(/^\d{8}$/)){
        obj["opened"] = false;
        obj["icon"] = "ti-calendar";
      }
      else if (xml.getAttribute('name').match(/Series/)){
        obj["opened"] = false;
        obj["icon"] = "ti-package";
      }
      else {
        obj["opened"] = false;
        obj["icon"] = "ti-user";
      }

      if (xml.hasChildNodes()) {
        obj["children"] = [];
        for (var i = 0; i < xml.childNodes.length; i++) {
          var item = xml.childNodes.item(i);
          if (item.nodeName == "dir")
            obj["children"].push(this.importPipelineXmlToJson(item, obj["path"]));
        }
      }
    }
    // else if(xml.nodeName == "DicomObject"){
    //   obj["type"] = xml.nodeName;
    //   obj["text"] = xml.getAttribute('name');
    //   obj["selected"] = true;
    //   obj["opened"] = false;
    //   obj["icon"] = "ti-image";
    //   if(xml.getAttribute('parent')) {
    //     obj["parent"] = xml.getAttribute('parent');
    //     obj["path"] = xml.getAttribute('parent');
    //     if (obj["path"] != "/")
    //       (obj["path"] += "/");
    //     obj["path"] += obj["text"];
    //   }
    //   else {
    //     obj["path"] = parent + "/" + obj["text"];
    //   }
    // }

    return obj;
  }

};
