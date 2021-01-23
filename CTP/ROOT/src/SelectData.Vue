<template>
  <div id="app-container">
    <div id="app-left">
      <div class="app-left-content">
        <h3>Select Your Data</h3>
        <p>Choose which studies or patients to anonymize.</p>
        <br/><br/>

        <table width="100%">
          <tr>
            <td width="20%" align="center">{{acceptedFileCount}}</td>
            <td width="80%" align="left"> files accepted</td>
          </tr>
          <tr>
            <td width="20%" align="center">{{skippedFileCount}}</td>
            <td width="80%" align="left"> files skipped</td>
          </tr>
        </table>


        <div class="step-btns-wrapper">
          <div class="btn-back">
            <i class="ti-arrow-circle-left" style="font-size: 30px; float: left;" v-on:click="startOverClick"> </i>
            <div style="float: left; padding-left: 6px; font-size: 12px;" v-on:click="startOverClick">Start Over</div>
          </div>
          <button class="btn-norm" v-on:click="nextTabClick">Next</button>
        </div>
      </div>
    </div>
    <div id="app-right">
      <div class="file-header">
        <table width="100%">
          <tr>
            <td>
              <span style="padding-left: 21px;">
                <input type="checkbox" v-model="selectDataChecked" v-on:change="onSelectDataCheckChanged"> Study/Patient/Series
              </span>
            </td>
            <!--<td>-->
              <!--<span class="file-count">{{acceptedFileCount}} files accepted</span>-->
              <!--<span class="file-count">{{skippedFileCount}} files skipped</span>-->
            <!--</td>-->
          </tr>
        </table>
      </div>
      <div class="app-right-content">
        <div class="file-list-row">
          <div v-for="subject in inImportPipeline">
            <div id="data-row-1" >
              <div class="data-col-0">
                <i v-if="subject.opened" class="ti-arrow-circle-down expand-icon" v-on:click="subject.opened=false"></i>
                <i v-else class="ti-arrow-circle-right expand-icon" v-on:click="subject.opened=true"></i>
              </div>
              <div class="data-col-1"><input type="checkbox" v-model="subject.selected" v-on:change="onCheckChanged"></div>
              <div class="data-col-2"><i class="ti-user data-icon"></i></div><div class="data-col-3" style="font-size: 12px; float: left; padding-right: 5px;">{{subject.text}}</div>
            </div>
            <div v-if="subject.opened"  v-for="date in subject.children">
              <div id="data-row-2">
                <div class="data-col-0">
                  <i v-if="date.opened" class="ti-arrow-circle-down expand-icon" v-on:click="date.opened=false"></i>
                  <i v-else class="ti-arrow-circle-right expand-icon" v-on:click="date.opened=true"></i>
                </div>
                <div class="data-col-1"><input type="checkbox" v-model="date.selected" v-on:change="onCheckChanged"></div>
                <div class="data-col-2"><i class="ti-calendar data-icon"></i></div><div class="data-col-3" style="font-size: 12px; float: left; padding-right: 5px;">{{date.text}}</div>
              </div>
              <div v-if="date.opened"  v-for="series in date.children" id="data-row-3">
                <div class="data-col-0"></div>
                <div class="data-col-1"><input type="checkbox" v-model="series.selected" v-on:change="onCheckChanged"></div>
                <div class="data-col-2"><i class="ti-package data-icon"></i></div><div class="data-col-3" style="font-size: 12px; float: left; padding-right: 5px;">{{series.text}}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <start-over-modal v-if="showModal" :dicomFiles.sync="dicomFiles" @close="showModal = false"></start-over-modal>
  </div>
</template>

<script>

  import startOverModal from "./startOverModal.vue";

  var parser = new DOMParser();
  var x2J = require('./xmlToJson.js');

  export default {
    components: {startOverModal},
    name: 'select-data',
    props:['inImportPipeline', 'acceptedFileCount', 'skippedFileCount'],
    methods:{
      nextTabClick: function(){
        this.$root.$emit('nextTab', 'SelectData');
      },
      startOverClick: function(){
        //First Check if there is anything ready to be exported
        this.$http.get('Collection/listAnonymized').then(response => {

          var xml = parser.parseFromString(response.body, "text/xml");
          var dicomObjects = xml.getElementsByTagName("DicomObject");

          if ( dicomObjects.length > 0 ){
            this.dicomFiles = dicomObjects.length;
            this.showModal = true;
          }
          else {
            this.$root.$emit('startOver', 'SelectData');
          }
        }, response => {
          this.$root.$emit('addError', "There was a problem retrieving the anonymized list.");
        });

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
          this.$root.$emit('addError', 'There was a problem retrieving the list of files in the import pipeline.');
        })
      },

      onCheckChanged: function (event) {
        this.$emit('update:inImportPipeline', this.inImportPipeline);
      },
      onSelectDataCheckChanged: function (event){

        //update all boxes to value of this.selectDataChecked
        for(var i in this.inImportPipeline){
          var patient = this.inImportPipeline[i];
          patient.selected = this.selectDataChecked;

          for(var j in patient.children){
            var date = patient.children[j];
            console.log("date " + j + " " + date);
            date.selected = this.selectDataChecked;

            for (var k in date.children){
              var series = date.children[k];
              series.selected = this.selectDataChecked;
            }

          }
        }

        this.$emit('update:inImportPipeline', this.inImportPipeline);

      }
    },
    data: function() {
      return {
        selectDataChecked: true,
        showModal: false,
        dicomFiles: 0
      }
    }
  }
</script>

<style lang="scss" scoped>

  #data-row-1, #data-row-2, #data-row-3 {
    padding-bottom: 26px;
    padding-top: 10px;
    margin-left: 6px;
    border-bottom: 1px #e9e9e9 solid;
    line-height: 20px; height: 20px;
  }

  #data-row-2 {
    padding-left: 40px;
  }

  #data-row-3 {
    padding-left: 80px;
  }

  #data-row-1:hover, #data-row-2:hover, #data-row-3:hover {
    background-color: #f5f5f5;
  }


  .data-col-0, .data-col-1, .data-col-2, .data-col-3 {
    float: left;
  }

  .data-col-0 {
    width: 18px;
  }
  .data-col-1 {
    width: 24px;
  }

  .data-icon {
    font-size: 18px;
    padding-right: 10px;
  }

  .expand-icon {
    font-size: 12px;
    padding-right: 4px;
  }

  .file-count{
    padding-left: 10px;
  }


</style>

