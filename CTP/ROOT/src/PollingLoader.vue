<template>

  <div id="app-container">
    <div id="app-left">
      <div class="app-left-content">
        <h3>{{info.header}}</h3>
        <p>{{info.instructions}}</p>
      </div>
    </div>
    <div id="app-right">
      <div class="app-right-content" style="padding-top: 20px">
        <div align="center">
          <h3>{{info.header}} Files</h3>
          <p>{{info.message}}</p>
        </div>
        <div class="loader" id="loader-1"></div>
        <div align="center">
          <button type="button" v-if="info.header == 'Anonymizing'" class="btn-big" v-on:click="pauseClick"> Pause </button>
          <button type="button" v-if="info.header == 'Importing'" class="btn-big" v-on:click="stopImportClick"> Cancel </button>
        </div>

      </div>
    </div>
  </div>


</template>

<script>
  var ctpService = require('./ctpService');

  export default {
    name: 'polling-loader',
    props: ['info'],
    methods:{
      pauseClick: function() {
        console.log("pause clicked!");
        ctpService.pauseAnonymization();
        sessionStorage.setItem('paused', 'true');
      },
      stopImportClick: function() {
        console.log("cancel import clicked!");
        ctpService.stopImport();
        this.$root.$emit('startOver', 'Modal');
      }
    }
  }
</script>

<style lang="scss" scoped>

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
    margin-top: 50px;
  }

  .btn-big:hover {
    background-color: #FF9C00;
  }

  .loader{
    width: 60px;
    height: 60px;
    border-radius: 100%;
    position: relative;
    margin: 0 auto;
  }

  #loader-1:before, #loader-1:after{
    content: "";
    position: absolute;
    left: -10px;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    border: 10px solid transparent;
    border-top-color: #5CB9F0;
  }

  #loader-1:before{
    z-index: 100;
    animation: spin 2s infinite;
  }

  #loader-1:after{
    border: 10px solid #ccc;
  }

  @keyframes spin{
    0%{
      -webkit-transform: rotate(0deg);
      -ms-transform: rotate(0deg);
      -o-transform: rotate(0deg);
      transform: rotate(0deg);
    }

    100%{
      -webkit-transform: rotate(360deg);
      -ms-transform: rotate(360deg);
      -o-transform: rotate(360deg);
      transform: rotate(360deg);
    }
  }

</style>
