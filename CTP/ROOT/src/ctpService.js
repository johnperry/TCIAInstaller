const axios = require("axios");
var parser = new DOMParser();

module.exports = {
  login: function(){
    return new Promise(function(resolve, reject){
      resolve(axios.get('/login/ajax?username=admin&password=tcia'));
    });
  },
  reset: function(){
    return new Promise(function(resolve, reject){
      resolve(axios.get('/Collection/reset'));
    });
  },
  postTemplate: function(file){
    var fileFormData = new FormData();
    fileFormData.append('file', file);

    axios.post('/Collection', fileFormData)
    .then(response =>{
      console.log("File submitted " + response.data);
    })
    .catch(error => {
      alert("There was a problem importing the file.");
    });
  },
  spaceForImport: function(filepath){

    axios.get('/Collection/getSpaceRequired?file=' + filepath)
      .then(response => {
        console.log("Space required: " + response.data);
        return response.data;
      })
      .catch(error => {
        alert("There was a problem retrieving the space required for import.")
      });

  },
  submitFile: function(filepath){
    return new Promise(function(resolve, reject){
      resolve(axios.get('/Collection/submitFile?file=' + filepath));
    });
  },
  stopImport: function(){
    axios.get('/Collection/abortImport')
      .then(response => {
        console.log('stop');
      })
      .catch(error =>{
        alert ("There was an error stopping the import.");
      })
  },
  pauseAnonymization: function () {
    axios.get('/Collection/pause')
      .then(response =>{
        console.log('pause');
      })
      .catch(error => {
        alert ("There was an error pausing the anonymization.");
      })
  },
  restart: function() {
    axios.get('/Collection/restart')
      .then(response => {
        console.log('restart');
      })
      .catch(error =>{
        alert ("There was an error restarting the anonymization.");
      })
  },
  restartRequeue: function() {
    axios.get('/Collection/restart/requeue')
      .then(response => {
        console.log('restartRequeue');
      })
      .catch(error =>{
        alert ("There was an error restarting the anonymization.");
      })
  },
  anonymizePaths: function(pathArray){
    console.log("pathsToAnonymize:" + pathArray.length);

    //Pass each selected path to the anonymizer function
    for (var k = 0; k < pathArray.length; k++)
    {
      var path = pathArray[k];
      var relativePath = path.substring(path.indexOf("DirectoryStorageService/"));

      axios.get('/Collection/anonymize?file=' + relativePath)
        .then(response =>{
          console.log('anonymizing ' + relativePath);
        })
        .catch(error => {
          alert("There was an error anonymizing " + relativePath);
        });
    }
  },
  clearManifest: function(){
    axios.get('/Collection/clearExportManifest')
      .then(response =>{
        console.log('manifest cleared');
      })
      .catch(error => {
        alert("There was an error clearing the manifest");
      });
  },
  exportmanifest: function(){
    axios.get('/Collection/exportManifest')
      .then(response=>{
        console.log("exportManifest: " + response.data);
      })
      .catch(error => {
        alert("There was an error exporting the manifest to the principal investigator.")
      });
  },
  exportHistory: function(){
    axios.get('/Collection/exportHistory')
      .then(response=>{
        console.log("exportHistory: " + response.data);
      })
      .catch(error => {
        alert("There was an error exporting the manifest to the principal investigator.")
      });
  },
  transferToTCIA: function () {
    var filepath = "DirectoryStorageService";

    axios.get('/Collection/export?file=' + filepath)
      .then(response => {
        console.log("export started " + response.data);
      })
      .catch(error => {
        alert("There was a problem exporting the files.")
      });
  },

};
