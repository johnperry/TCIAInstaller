<template>
  <div id="app-container">
    <div id="app-left">
      <div class="app-left-content">
        <h3>Configure</h3>
        <p>A spreadsheet by the filename of <strong>TCIA-submission-template.xlsx</strong> has been saved in your default download location. Our software will use this information to determine which Collection your patients belong in, and to replace your patient IDs and dates with anonymized data.</p>
        <p>Fill in the desired Anonymized Patient ID column and import the file.</p>
      </div>
    </div>
    <div id="app-right">
      <div class="app-right-content" style="padding-top: 20px">
        <div align="center">
          <h3>Import the file</h3>
          <p>(see instructions to left)</p>
        </div>

        <div style="margin-top: 50px;">
          <input type="file" name="file" class="inputfile" accept=".xlsx" id="templateFile" v-on:change="updateFileName"/>
          <div align="center"><label for="templateFile" class="btn-big">Choose File</label></div>
          <div align="center"><p>{{filename}}</p></div>
        </div>
      </div>
    </div>

    <div class="step-btns-bar">
      <div class="btn-back" v-on:click="startOverClick">
        <i class="ti-arrow-circle-left" style="font-size: 30px; float: left;" > </i>
        <div style="float: left; padding-left: 6px; padding-top:10px; font-size: 12px;">Start Over</div>
      </div>
      <button class="btn-norm" v-on:click="nextTabClick">Anonymize</button>
    </div>

    <start-over-modal v-if="showModal" :dicomFiles.sync="dicomFiles" @close="showModal = false"></start-over-modal>
  </div>
</template>

<script>

  import startOverModal from "./startOverModal.vue";

  var parser = new DOMParser();

  export default {
    components: {startOverModal},
    name: 'configure',
    methods: {
      nextTabClick: function(){
        this.$root.$emit('nextTab', 'Configure');
      },
      prevTabClick: function(){
        this.$root.$emit('prevTab', 'Configure');
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
            this.$root.$emit('startOver', 'Configure');
          }
        }, response => {
          this.$root.$emit('addError', "There was a problem retrieving the anonymized list.");
        });

      },
      updateFileName: function() {
        this.filename = document.getElementById('templateFile').files[0].name;
      },
    },
    data: function() {
      return {
        filename: "No File Chosen",
        showModal: false,
        dicomFiles: 0
      }
    }
  }

</script>


<style lang="scss" scoped>

  .inputfile {
    width: 0.1px;
    height: 0.1px;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: -1;
  }

  .btn-big,
  .btn-big:focus {
    color: #ffffff;
    text-shadow: none; /* Prevent inheritance from `body` */
    background-color: #5CB9F0;
    border: 1px solid #fff;
    width: 100px;
    padding: 10px;
    border-radius: 60px;
    margin-right: auto;
    margin-left: auto;
    margin-top: 80px;
  }

  .btn-big:hover {
    background-color: #FF9C00;
  }


</style>
