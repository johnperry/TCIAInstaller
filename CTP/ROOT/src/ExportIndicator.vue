<template>

  <div id="export_indicator" class="export-indicator" >
    <div v-if="exporting"class="loader" id="loader-2"></div>
    <h5 v-if="exporting">Transferring images ... </h5>
  </div>

</template>

<script>
  var ctpService = require('./ctpService');
  var parser = new DOMParser();

  export default {
    name: 'export-indicator',
    mounted(){

      var a = this;
      setInterval(function(){

        if (!a.isHidden()) {
          var myhttp = a.$http;
          myhttp.get('/Collection/exportStatus').then(response => {
              var xml = parser.parseFromString(response.body, "text/xml");
              var active = xml.getElementsByTagName("ACTIVE")[0];

              if (active)
                a.exporting = true;
              else {
                a.exporting = false;
              }
            },
            response => {
              this.exporting = false;
              console.log("error fetching exportStatus")
            })
        }

      }, 8000);

    },
    methods: {
      isHidden: function () {
        var indicator = document.getElementById("export_indicator");
        var style = window.getComputedStyle(indicator);
        return (style.display === 'none')
      }
    },
    data: function() {
      return {
        exporting: true
      }
    }
  }
</script>

<style lang="scss" scoped>

  .export-indicator{
    width: 200px;
    padding-top: 20px;
  }

  .export-indicator > h5{
    padding-left: 2em;
    position: relative;
    top: -30px;
  }

  .loader{
    width: 20px;
    height: 20px;
    border-radius: 100%;
    position: relative;
    margin-left: 10px;
    margin-right: 3px;
  }

  #loader-2:before, #loader-1:after{
    content: "";
    position: absolute;
    left: -100px;
    width: 100%;
    height: 100%;
    border-radius: 100%;
    border: 5px solid transparent;
    border-top-color: #5CB9F0;
  }

  #loader-2:before{
    z-index: 100;
    animation: spin 2s infinite;
  }

  #loader-2:after{
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
