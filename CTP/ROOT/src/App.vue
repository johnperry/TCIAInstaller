<template>
  <div id="app">

    <alert v-bind:errors="errorMessages"></alert>

    <form-wizard
                 @on-complete="onComplete"
                 @on-loading="setLoading"
                 @on-validate="handleValidation"
                 @on-change="onChange"
                 color="#4fc6f9"
                 title=""
                 subtitle=""
                 errorColor="#FDA02C"
                 ref = "wizard"
                  >

      <!-- Tab 0 -->
      <tab-content title="Import" icon="ti-files" :before-change="copyIntoImportPipeline">
        <div v-if="loadingWizard === false">

          <import v-if="loggedIn" ref="importComponent" :currentFileSystemPath.sync="currentFileSystemPath" :alreadyImported.sync="alreadyImported"></import>

          <div class="bottomInfo"> Download my <a class="link" v-on:click="downloadHistoryPHI">Submission History</a></div>
        </div>
      </tab-content>

      <!-- Tab 1  -->
      <tab-content title="Confirm" icon="ti-target" :before-change="selectFromImport">
        <div v-if="loadingWizard === false">

          <confirm-data :inImportPipeline.sync="inImportPipeline" :acceptedFileCount.sync="acceptedFileCount" :skippedFileCount.sync="skippedFileCount"></confirm-data>

          <div class="bottomInfo">Optionally, <a class="link" v-on:click="downloadImportManifest">download a manifest</a> of imported items</div>
        </div>
      </tab-content>

      <!-- Tab 2 -->
      <tab-content title="Configure" icon="ti-map" :before-change="configAndAnonymize">
        <div v-if="loadingWizard === false">
          <configure></configure>
        </div>
      </tab-content>

      <!-- Tab 3 -->
      <tab-content title="Anonymize" icon="ti-lock" :before-change="transferToTCIA">
        <div v-if="loadingWizard === false">
          <anonymization-results v-bind:patientsAnonymized="patientsAnonymized" v-bind:studiesAnonymized="studiesAnonymized" v-bind:seriesAnonymized="seriesAnonymized" v-bind:quarantines="quarantines"></anonymization-results>
        </div>
      </tab-content>

      <!-- Tab 4 -->
      <tab-content title="Transfer" icon="ti-export">
        <finished></finished>

        <div class="bottomInfo"> Download my <a class="link" v-on:click="downloadHistoryPHI">Submission History</a></div>
      </tab-content>

      <polling-loader v-if="loadingWizard" v-bind:info="loadingInfo"></polling-loader>

    </form-wizard>



  </div>
</template>



<script>
  import Alert from "./Alert.vue";
  import PollingLoader from './PollingLoader.vue'
  import AnonymizationResults from "./AnonymizationResults.vue";
  import Finished from "./Finished.vue";
  import Configure from "./Configure.vue";

  var parser = new DOMParser();
  import { saveAs } from 'filesaver.js-npm';
  import Import from "./Import.vue";
  import ConfirmData from "./ConfirmData.vue";

  var x2J = require('./xmlToJson.js');
  var ctpService = require('./ctpService');


  export default {
    name: 'app',
    components: {
      ConfirmData,
      Import,
      Configure,
      Finished,
      AnonymizationResults,
      Alert,
      PollingLoader},
    mounted() {

      var a = this;
      ctpService.login().then(function (response) {
        console.log("Logged In");
        ctpService.reset().then(function(){
          console.log("reset");
          a.loggedIn = true;
        });
      });

      console.log("Mounted");
      this.hideButtons();

      this.$root.$on('nextTab', function(fromTab){
        //The actual wizard button is hidden, but force a click on it.
        var footerRight = document.getElementsByClassName('wizard-footer-right')[0];
        var spanTag = footerRight.getElementsByTagName('span')[0];
        var nextButton = spanTag.getElementsByClassName('wizard-btn')[0];
        nextButton.click();
      });

      this.$root.$on('prevTab', function(fromTab){
        var footerLeft = document.getElementsByClassName('wizard-footer-left')[0];
        var spanTag = footerLeft.getElementsByTagName('span')[0];
        var backButton = spanTag.getElementsByClassName('wizard-btn')[0];
        backButton.click();
      });

      this.$root.$on('startOver', function(fromTab){
          ctpService.reset();
          location.reload();
      });

      this.$root.$on('addError', function(errorMessage){
        this.errorMessages.push(errorMessage);
      });

      this.setInitialLoadingInfo("importing");

      sessionStorage.setItem('paused', 'false');
    },
    methods: {
      onChange: function(fromTab, toTab) {
        console.log('onChange from:' + fromTab + " to:" + toTab);
        this.hideButtons();
        switch(toTab) {
          case 0:  //Import Data
            this.setInitialLoadingInfo("importing");
            break;
          case 1:  //Confirm Data
            this.updateImportPipelineTree();
            break;
          case 2:  //Configure
            this.downloadSubmissionTemplate();
            this.setInitialLoadingInfo("anonymizing");
            break;
          case 3:  //Anonymize
            //Get the list of images that have been anonymized
            this.updateAnonymizationNumbers();
            this.setInitialLoadingInfo("exporting");
            this.downloadMappingManifest();
            break;
          case 4:  //Transfer
            break;
          default:
            break;
        }
      },
      setLoading: function(value) {
        console.log("loading: " + value);
        this.loadingWizard = value;
      },
      onComplete: function(){
        console.log("Complete");
      },
      handleValidation: function(isValid, tabIndex){
        console.log('Tab: '+tabIndex+ ' valid: '+isValid)
      },
      configAndAnonymize: function(){

        //Import Submission Template
        var file = document.getElementById('templateFile').files[0];
        if (file) {
          ctpService.postTemplate(file);
        }
        else {
          this.errorMessages.push('Please select a submission template to import before continuing.');
          return false;
        }


        var previousQuarantineCount = 0;
        var previousManifestInstanceCount = 0;
        //Call this once ahead of time to see how many are already in there.
        this.$http.get('/Collection/getExportManifestStatus').then(response => {
          console.log("initializeAnonymizerPipelineCounts: " + response.body);
          var xml = parser.parseFromString(response.body, "text/xml");
          var status = xml.getElementsByTagName("Status")[0];
          previousQuarantineCount = parseInt(status.getAttribute("currentQuarantineCount"));
          previousManifestInstanceCount = parseInt(status.getAttribute("currentManifestInstanceCount"));
        });


        if (sessionStorage.getItem('paused') == 'true'){
          //Restart    (requeue by default?)
          ctpService.restartRequeue();
        }
        else {
          //Anonymize
          ctpService.anonymizePaths(this.pathsToAnonymize);
        }


        sessionStorage.setItem('paused', 'false');
        var a = this;
        return new Promise((resolve, reject) => {
          var myhttp = this.$http;

          var checkstatus = function(){
            setTimeout(function(){
              myhttp.get('/Collection/getExportManifestStatus').then(response => {
                console.log("getExportManifestStatus: " + response.body);
                var xml = parser.parseFromString(response.body, "text/xml");
                var status = xml.getElementsByTagName("Status")[0];
                var currentManifestInstanceCount = parseInt(status.getAttribute("currentManifestInstanceCount"));
                var currentQuarantineCount = parseInt(status.getAttribute("currentQuarantineCount"));
                var queuedInstanceCount = parseInt(status.getAttribute("queuedInstanceCount"));
                var startingQuarantineCount = parseInt(status.getAttribute("startingQuarantineCount"));

                var complete = (startingQuarantineCount + queuedInstanceCount) == (currentQuarantineCount + currentManifestInstanceCount);

                console.log("anonymization complete: " + complete);
                console.log("number of Dicom Files Imported: " + a.numDicomFilesImported);
                console.log("previousQuarantineCount: " + previousQuarantineCount);
                console.log("previousManifestInstanceCount: " + previousManifestInstanceCount);
                var processed = a.numDicomFilesImported - (currentQuarantineCount - previousQuarantineCount + currentManifestInstanceCount- previousManifestInstanceCount);
                a.loadingInfo.message = "Processing " + processed + " files";
                if (currentQuarantineCount > 0)
                  a.loadingInfo.message += "  " + currentQuarantineCount + " Quarantines";
                if (complete) {
                  a.quarantines = currentQuarantineCount;
                  resolve(complete);
                }
                else if (sessionStorage.getItem('paused') == 'true')
                {
                  resolve(false);
                }
                else
                  checkstatus();
              })
            }, 1000)
          }
          checkstatus();
        })
      },
      copyIntoImportPipeline: function () {

        console.log("method: copyIntoImportPipeline");
        console.log("currentFileSystemPath:" + this.currentFileSystemPath);




        var a = this;
        return new Promise((resolve, reject) => {
          var myhttp = a.$http;


          if (this.alreadyImported == false) {
            myhttp.get('/Collection/getSpaceRequired?file=' + this.currentFileSystemPath).then(response => {
              console.log(response.body);
              var xml = parser.parseFromString(response.body, "text/xml");
              var partition = xml.getElementsByTagName("space")[0].getAttribute("partition");
              var available = parseInt(xml.getElementsByTagName("space")[0].getAttribute("available"));
              var units = xml.getElementsByTagName("space")[0].getAttribute("units");
              var required = parseInt(xml.getElementsByTagName("space")[0].getAttribute("required"));

              //Check to ensure there is at least 1GB of left space.  Else do not allow to move forward
              //Currently units always returned as MB
              var enoughSpace = (available - required > 1000);

              if (enoughSpace) {
                //submit the files
                ctpService.submitFile(this.currentFileSystemPath).then(function (response) {
                  console.log("submitFile response body: " + response.data);
                  var xml = parser.parseFromString(response.data, "text/xml");
                  console.log("xml: " + xml);
                  if (xml.getElementsByTagName("NOTOK")[0]) {
                    a.filesSubmittedOk = -1;
                    a.errorMessages.push("There was a problem copying the files into the import pipeline.");
                    resolve(false);
                  }
                  else {
                    a.filesSubmittedOk = 1;
                    a.acceptedFileCount = xml.getElementsByTagName("OK")[0].getAttribute("acceptedFileCount");
                    a.skippedFileCount = xml.getElementsByTagName("OK")[0].getAttribute("skippedFileCount");
                  }
                });
              }
              else {
                //Hard stop if there is not enough space to continue
                this.errorMessages.push('There is not enough room on the drive to import the selected data! Try selecting a smaller dataset.')
                resolve(false);
              }
            })
          }


          var checkstatus = function(){
            setTimeout(function(){
              myhttp.get('/Collection/getImportStatus').then(response => {
                console.log("getImportStatus: " + response.body);
                var xml = parser.parseFromString(response.body, "text/xml");
                var status = xml.getElementsByTagName("status")[0];
                var queueSize = status.getAttribute("queueSize");
                console.log("alreadyImported: " + a.alreadyImported);
                var complete = queueSize == 0 && (a.filesSubmittedOk != 0 || a.alreadyImported == true);
                console.log("import complete: " + complete);

                if (complete)
                  resolve(complete);
                else {
                  myhttp.get('/Collection/getImportManifestInstanceCount').then(response => {
                    console.log("getImportManifestInstanceCount: " + response.body);
                    var instanceCountXml = parser.parseFromString(response.body, "text/xml");
                    var statusImported = instanceCountXml.getElementsByTagName("status")[0];
                    var countImported = statusImported.getAttribute("instanceCount");
                    a.loadingInfo.message = "Processing " + countImported + " files";
                  })
                  checkstatus();
                }
              })
            }, 1000)
          }
          checkstatus();
        })

      },
      updateImportPipelineTree: function(){
        this.$http.get('/Collection/listImport').then(response => {
          var xml = parser.parseFromString(response.body, "text/xml");
          this.numDicomFilesImported = parseInt(xml.getElementsByTagName("DicomFiles")[0].getAttribute("count"));
          var dirStorageXML = xml.getElementsByTagName("DicomFiles")[0].childNodes[0];
          var json = x2J.importPipelineXmlToJson(dirStorageXML);
          console.log(json);
          this.inImportPipeline = json.children;
        }, response =>{
          this.errorMessages.push("There was a problem retrieving the list of files in the import pipeline.");
        })
      },
      selectFromImport: function(){

        //Get the selected items
        this.pathsToAnonymize = [];
        this.patientIDsToAnonymize = [];
        //get each selected item from the tree view
        for (var i = 0; i < this.inImportPipeline.length; i++){
          var patient = this.inImportPipeline[i];
          if(patient.selected) {
            console.log('anonymize ' + patient.path);
            this.pathsToAnonymize.push(patient.path);
            console.log('patientID: ' + patient.patientID);
            this.patientIDsToAnonymize.push(patient.patientID);
          }
          else if (patient.children){
            //check if any children are selected
            for(var j = 0; j < patient.children.length; j++){
              var studyDate = patient.children[j];
              if (studyDate.selected) {
                console.log('anonymize ' + studyDate.path);
                this.pathsToAnonymize.push(studyDate.path);
                console.log('patientID: ' + studyDate.patientID);
                this.patientIDsToAnonymize.push(studyDate.patientID);
              }
              else if(studyDate.children){
                //check if any series are selected
                for(var j = 0; j < studyDate.children.length; j++) {
                  var series = studyDate.children[j];
                  if (series.selected) {
                    console.log('anonymize ' + series.path);
                    this.pathsToAnonymize.push(series.path);
                    console.log('patientID: ' + series.patientID);
                    this.patientIDsToAnonymize.push(series.patientID);
                  }
                }
              }
            }
          }
        }

        return true;
      },
      updateAnonymizationNumbers: function () {
        this.$http.get('Collection/listAnonymized').then(response => {
          console.log("updateAnonymizationNumbers");
          var xml = parser.parseFromString(response.body, "text/xml");
          var dicomObjects = xml.getElementsByTagName("DicomObject");

          var patientSet = new Set();
          var seriesSet = new Set();
          var studySet = new Set();

          for (var i= 0; i< dicomObjects.length; i++) {
            patientSet.add(dicomObjects[i].getAttribute('PatientID'));
            studySet.add(dicomObjects[i].getAttribute('StudyDate'));
            seriesSet.add(dicomObjects[i].getAttribute('PatientID') + dicomObjects[i].getAttribute('StudyDate') + dicomObjects[i].getAttribute('Series'));
          }

          this.patientsAnonymized = patientSet.size;
          this.studiesAnonymized = studySet.size;
          this.seriesAnonymized = seriesSet.size;

        }, response => {
          this.errorMessages.push("There was a problem retrieving the anonymized list.");
        });
      },
      transferToTCIA: function () {

        ctpService.transferToTCIA();

        return new Promise((resolve, reject) => {
          var myhttp = this.$http;
          var a = this;

          var checkExportStatus = function(){
            setTimeout(function(){
              myhttp.get('/Collection/exportStatus').then(response => {
                var xml = parser.parseFromString(response.body, "text/xml");
                var active = xml.getElementsByTagName("ACTIVE")[0];

                if (active) {
                  a.loadingInfo.message = "Exporting to TCIA";
                  checkExportStatus();
                }
                else {
                  resolve(true);
                }
              })
            }, 3000)
          }

          var checkQueueStatus = function(){
            setTimeout(function(){
              myhttp.get('/Collection/getExportQueueSize').then(response => {
                console.log("getExportQueueSize: " + response.body);
                var xml = parser.parseFromString(response.body, "text/xml");
                var queue = xml.getElementsByTagName("queue")[0];
                var queueSize = queue.getAttribute("size");
                var queuingComplete = queueSize == 0;
                console.log("queuing complete: " + queuingComplete);
                if (queuingComplete){
                  a.exportToPI();

                  checkExportStatus();

                  //resolve(queuingComplete);
                }
                else {
                  a.loadingInfo.message = "Queuing " + queueSize + " files for Export";
                  checkQueueStatus();
                }
              })
            }, 3000)
          }

          checkQueueStatus();
        })

      },
      hideButtons: function(){
        console.log("hiding buttons");

        var footerLeft = document.getElementsByClassName('wizard-footer-left')[0];
        footerLeft.style.display = "none";
        var footerRight = document.getElementsByClassName('wizard-footer-right')[0];
        footerRight.style.display = "none";
      },
      downloadImportManifest: function(){
        var today = (new Date()).toISOString().substring(0, 10);
        var filename = "TCIA-import-" + today + ".xlsx";

        this.$http({method: 'GET', url: "/Collection/listImportManifest/xlsx",
          headers: {'Content-Type': "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}, responseType: "arraybuffer"}).
        then(response =>{
          saveAs(new Blob([response.body],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename);
        }, response=>{
          this.errorMessages.push("There was an error getting the import manifest.");
        });
      },
      downloadSubmissionTemplate: function(){
        var filename = "TCIA-submission-template.xlsx";

        // /Collection/listLookupTableTemplate?id=PatientID1|PatientID2|...|PatientIDn
        var templateUrl = "/Collection/listLookupTableTemplate";

        if (this.patientIDsToAnonymize.length > 0){
          templateUrl += "?id=";
          for(var i = 0; i < this.patientIDsToAnonymize.length; i++){
            console.log('patientIDsToAnonymize: ' + this.patientIDsToAnonymize[i]);
            templateUrl += this.patientIDsToAnonymize[i] + "|";
          }
        }

        this.$http({method: 'GET', url: templateUrl,
          headers: {'Content-Type': "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}, responseType: "arraybuffer"}).
        then(response =>{
          saveAs(new Blob([response.body],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename);
        }, response=>{
          this.errorMessages.push("There was an error getting the submission template.");
        });
      },
      downloadMappingManifest: function(){

        var today = (new Date()).toISOString();
        var filename = "TCIA-mapping-" + today + ".xlsx";

        this.$http({method: 'GET', url: "/Collection/listLocalManifest/xlsx",
          headers: {'Content-Type': "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}, responseType: "arraybuffer"}).
            then(response =>{
            saveAs(new Blob([response.body],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename);
          }, response=>{
          this.errorMessages.push("There was an error getting the mapping manifest.");
          });

      },
      downloadHistoryPHI: function(){
        var today = (new Date()).toISOString();
        var filename = "TCIA-history-phi-" + today + ".xlsx";

        this.$http({method: 'GET', url: "/Collection/listHistory/phi",
          headers: {'Content-Type': "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}, responseType: "arraybuffer"}).
        then(response =>{
          saveAs(new Blob([response.body],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}), filename);
        }, response=>{

        });
      },
      exportToPI: function(){
        ctpService.exportmanifest();
        ctpService.exportHistory();
      },
      shutDownCTP: function(){
        this.$http.get('/shutdown').then(response=>{
          console.log("CTP shutdown complete.");
          this.hideButtons();
          this.$modal.hide('dialog');
        }, response =>{
          this.errorMessages.push("Failed to shutdown CTP.")
        });
      },
      setInitialLoadingInfo: function(state){
        if (state == "anonymizing")
        {
          this.loadingInfo.header = "Anonymizing";
          this.loadingInfo.instructions = "Please be patient while the TCIA Submission Tool anonymizes the DICOM files you selected. " +
            "  You may PAUSE the anonymization process at anytime."
        }
        else if (state == "importing")
        {
          this.loadingInfo.header = "Importing";
          this.loadingInfo.instructions = "Please be patient while the TCIA Submission Tool imports the DICOM files you selected. ";
        }
        else if (state == "exporting")
        {
          this.loadingInfo.header = "Exporting";
          this.loadingInfo.instructions = "Please be patient while the TCIA Submission Tool exports your anonymized DICOM files.";
        }

        //Always start this with a blank message.  Will be updated by the current poller
        this.loadingInfo.message = "";
      }

    },
    data: function() {
      return {
        loggedIn: false,
        loadingWizard: false,
        loadingInfo: {
          header: "",
          instructions: "",
          message: ""
        },
        filesSubmittedOk: 0,
        serverSpace: "0",
        numDicomFilesImported: 0,
        currentFileSystemPath: "/",
        patientsAnonymized: 0,
        studiesAnonymized: 0,
        seriesAnonymized: 0,
        quarantines: 0,
        currentPathIsDir: true,
        fileSystem: [{
            "text": "Retrieving directory information",
            "opened": true,
            "icon": "ti-alert"
          }],
        inImportPipeline: [{
          "text": "Gathering data from import pipeline. Please wait a moment...",
          "opened": true,
          "icon": "ti-alert"
        }],
        pathsToAnonymize: [],
        patientIDsToAnonymize: [],
        errorMessages: [],
        showModal: true,
        acceptedFileCount: 0,
        skippedFileCount: 0,
        alreadyImported: false
      }
    }

  }

</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  margin-top: 50px;
  min-width: 700px;
}


  h1, h2 {
    font-weight: normal;
  }


  .link{
    color: #FFDC00 !important;
  }


  .vue-form-wizard .wizard-icon-circle {
    font-size: 18px;
    border: 3px solid #f3f2ee;
    border-top-color: rgb(243, 242, 238);
    border-right-color: rgb(243, 242, 238);
    border-bottom-color: rgb(243, 242, 238);
    border-left-color: rgb(243, 242, 238);
    border-radius: 50%;
    font-weight: 600;
    width: 70px;
    height: 70px;
    background-color: #333333;
    position: relative;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -ms-flex-line-pack: center;
    align-content: center;
  }

  a, a:focus, a:hover {
    color: #ccc !important;
  }

  .vue-form-wizard .wizard-icon-circle {
    font-size: 18px;
    border: 3px solid #333;
    border-radius: 50%;
    font-weight: 600;
    width: 70px;
    height: 70px;
    background-color: #333333;
    position: relative;
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-pack: center;
    -ms-flex-pack: center;
    justify-content: center;
    -ms-flex-line-pack: center;
    align-content: center;
  }

  .v--modal{
    background-color: #4fc6f9 !important;
  }

  .bottomInfo{
    position: fixed;
    z-index: 101;
    bottom: 0;
    left: 0;
    right: 0;
    background: #444444;
    text-align: center;
    line-height: 2.5;
    overflow: hidden;
    -webkit-box-shadow: 0 0 5px black;
    -moz-box-shadow:    0 0 5px black;
    box-shadow:         0 0 5px black;
  }


#app-container {
  width: 100%;
  margin: 0 auto;
  box-shadow: 0px 0px 20px 0px #5CB9F0;
  height: 330px;
  border-radius: 10px;
  position: relative;
}

#app-left, #app-right {
  float: left;
  min-height: 330px;
  /*color: aqua;*/
}

#app-left {
  width: 40%;
  min-width: 0px;
  background-color: #333333;
  color: #e9e9e9;
  border-radius: 10px 0px 0px 10px;
  /*border-radius: 10px 0px 10px 0px;*/
  height: 330px;
}

#app-right {
  width: 60%;
  min-width: 0px;
  background-color: #f9f9f9;
  color: #444444;
  border-radius: 0px 10px 10px 0px;
  /*border-radius: 10px 0px 0px 10px;*/
  height: 330px;
  /*overflow: scroll;*/
}

.app-left-content {
  position: relative;
  padding: 20px;
  text-align: left;
  color:#e9e9e9;
  height: 290px;
}

div.app-left-content p, div.app-right-content p {
  font-size: 13px;
}

div.app-left-content h3 {
  font-size: 24px;
  margin: 0px;
  font-weight: 200;
}

.app-right-content {
  text-align: left;
  color:#444;
}


div.app-right-content td {
  font-size: 11px;
  padding-bottom: 14px;
  padding-top: 14px;
  border-bottom: 1px #e9e9e9 solid;
}

.file-list-row {
  padding: 0px 10px 0px 10px;
  overflow-y: scroll;
  height:250px;
}

.file-header {
  background-color: #5CB9F0;
  width: auto;
  min-height: 18px;
  border-radius: 0px 10px 0px 0px;
  /*border-radius: 10px 0px 0px 0px;*/
  font-size: 9px;
  color: #333;
  text-align:left;
  padding: 6px 10px;
  text-transform: uppercase;
  font-weight: 600;
}


.step-btns-wrapper {
  position: absolute;
  width: 95%;
  bottom: -20px;
  left: 0;
  padding: 10px;
  line-height: 30px; height: 30px;
}

.step-btns-bar {
   width: 100%;
   min-height: 35px;
   border-radius: 0px 0px 10px 10px;
   border-top: 1px solid #5CB9F0;
   background-color: #333333;
   padding: 6px 10px;
   position: absolute;
   bottom: 0;
 }



.btn-norm,
.btn-norm:focus {
  color: #ffffff;
  text-shadow: none; /* Prevent inheritance from `body` */
  font-size: 12px;
  background-color: #5CB9F0;
  padding: 8px 10px 8px 10px;
  border-radius: 6px;
  /*height: 14px;*/
  line-height: 14px;
  float: right;
  border: none;
}

/*.btn-back{*/
  /*color: #5CB9F0;*/
/*}*/

.btn-norm:hover {
  background-color: #FF9C00;
}

.btn-back:hover{
  color: #FF9C00;
}

.wizard-nav a {
   pointer-events: none;
   cursor: default;
 }


.wizard-nav li {
  pointer-events: none;
  cursor: default;
}

</style>
