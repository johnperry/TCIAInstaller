<template>
  <div id="app-container">
    <div id="app-left">
      <div class="app-left-content">
        <!--<h3>Submitting</h3>-->
        <!--<p>Your files are queued and CTP is transferring them to TCIA.  This could take awhile!</p>-->
        <!--<p>You may import more data or close this window.  Your files will continue to submit as long as CTP is not stopped.</p>-->
        <h3>Finished</h3>
        <p>Your files have been transferred to TCIA. You may import more data or close this window.</p>
      </div>
    </div>
    <div id="app-right">
      <div class="app-right-content">
        <div align="center">
          <img src="src/assets/tcia_insignia_color_med.png" width="100" style="padding-top: 30px;">
          <h4>Thank you for submitting your data!</h4>
          <!--<export-indicator></export-indicator>-->
        </div>
      </div>
    </div>

    <div class="step-btns-bar">
      <div class="btn-back" v-on:click="newImportClick">
        <i class="ti-arrow-circle-left" style="font-size: 30px; float: left;" > </i>
        <div style="float: left; padding-left: 6px; padding-top:10px; font-size: 12px;" >New Import</div>
      </div>
      <button class="btn-norm" v-on:click="closeClick">Close</button>
    </div>

    <shut-down-modal v-if="showModal"  @close="showModal = false"></shut-down-modal>
  </div>
</template>

<script>
  import ShutDownModal from "./shutDownModal.vue";

  import { saveAs } from 'filesaver.js-npm';
  import ExportIndicator from "./ExportIndicator.vue";

  export default {
    components: {
//      ExportIndicator,
      ShutDownModal},
    name: 'finished',
    methods: {
      closeClick: function () {
        this.showModal = true;
        //this.$root.$emit('nextTab', 'Finished');
      },
      newImportClick: function () {
        this.$root.$emit('startOver', 'Finished');
      }
    },
    data: function() {
      return {
        showModal: false
      }
    }
  }
</script>


<style lang="scss" scoped>

</style>
