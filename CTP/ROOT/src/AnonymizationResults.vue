<template>
  <div id="app-container">
    <div id="app-left">
      <div class="app-left-content">
        <h3>Review Anonymization</h3>
        <p>Your data has been anonymized. A spreadsheet which records the mapping of the identified version of your data to the original has been saved in your default download location.</p>
        <p>NOTE: Check any quarantines that show up (to right).</p>
      </div>
    </div>
    <div id="app-right">
      <div class="file-header">
        <table width="100%">
          <tr>
            <td width="100%" align="center">Anonymization Results</td>
          </tr>
        </table>
      </div>
      <div class="app-right-content">
        <div class="results-list-row">
          <table width="100%">
            <tr>
              <td width="25%" align="right"><div class="ti-user"></div></td>
              <td width="50%" align="center">Patients Processed</td>
              <td width="25%" align="left">{{patientsAnonymized}}</td>
            </tr>
            <tr>
              <td width="25%" align="right"><div class="ti-calendar"></div></td>
              <td width="50%" align="center">Studies Processed</td>
              <td width="25%" align="left">{{studiesAnonymized}}</td>
            </tr>
            <tr>
              <td width="25%" align="right"><div class="ti-package"></div></td>
              <td width="50%" align="center">Series Processed</td>
              <td width="25%" align="left">{{seriesAnonymized}}</td>
            </tr>
            <tr class="green" v-if="quarantines == 0">
              <td width="25%" align="right"><i class="ti-face-smile"></i></td>
              <td width="50%" align="center">Quarantines</td>
              <td width="25%" align="left">0</td>
            </tr>
            <tr class="highlight" v-if="quarantines > 0">
              <td width="25%" align="right"><div class="ti-alert"></div></td>
              <td width="50%" align="center"><a class="highlight" target="_blank" href="/quarantines"> Quarantines:</a></td>
              <td width="25%" align="left"><a class="highlight" target="_blank" href="/quarantines"> {{quarantines}}</a></td>
            </tr>
          </table>
        </div>
      </div>
    </div>

    <div class="step-btns-bar">
      <div class="btn-back" v-on:click="startOverClick">
        <i class="ti-arrow-circle-left" style="font-size: 30px; float: left;" > </i>
        <div style="float: left; padding-left: 6px; padding-top:10px; font-size: 12px;">Start Over</div>
      </div>
      <button class="btn-norm" v-on:click="nextTabClick">Transfer</button>
    </div>

    <start-over-modal v-if="showModal" :dicomFiles.sync="dicomFiles" @close="showModal = false"></start-over-modal>
  </div>
</template>

<script>

  import startOverModal from "./startOverModal.vue";

  var parser = new DOMParser();

  export default {
    components: {startOverModal},
    name: 'anonymization-results',
    props: ['patientsAnonymized', 'studiesAnonymized', 'seriesAnonymized', 'quarantines'],
    methods: {
      nextTabClick: function () {
        this.$root.$emit('nextTab', 'Transfer');
      },
      prevTabClick: function () {
        this.$root.$emit('prevTab', 'Transfer');
      },
      startOverClick: function () {

        //First Check if there is anything ready to be exported
        this.$http.get('Collection/listAnonymized').then(response => {

          var xml = parser.parseFromString(response.body, "text/xml");
          var dicomObjects = xml.getElementsByTagName("DicomObject");

          if ( dicomObjects.length > 0 ){
            this.dicomFiles = dicomObjects.length;
            this.showModal = true;
          }
          else {
            this.$root.$emit('startOver', 'Transfer');
          }
        }, response => {
          this.$root.$emit('addError', "There was a problem retrieving the anonymized list.");
        });

      }
    },
    data: function() {
      return {
        showModal: false,
        dicomFiles: 0
      }
    }
  }
</script>

<style lang="scss" scoped>

  div.app-right-content td {
    font-size: 11px;
    padding-bottom: 14px;
    padding-top: 14px;
    border-bottom: 1px #e9e9e9 solid;
  }


  .file-list-row {
    padding: 10px;
    overflow-y: scroll;
    height:250px;
  }

  .file-header {
    background-color: #5CB9F0;
    width: auto;
    min-height: 18px;
    border-radius: 0px 10px 0px 0px;
    font-size: 9px;
    color: #333;
    text-align:left;
    padding: 6px 10px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .results-list-row {
    padding: 10px;
    overflow-y: scroll;
    height:250px;
  }

  .results-list-row table tr td {
    font-size: 20px;
  }

  .highlight {
    color: red !important;
  }

  .green {
    color: limegreen;
  }

</style>
