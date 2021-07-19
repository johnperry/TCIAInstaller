<template>
  <div id="app-container">

    <div id="app-left">
      <div class="app-left-content">
        <h3>Import Your Data</h3>
        <p>Browse your computer and locate the directory containing the DICOM data you would like to submit. All sub-directories will be included in the import.</p>

        <p>NOTE: The act of importing creates a copy of your data. Please ensure you have enough free space. You currently have {{serverSpace}}.</p>

        <p>Or</p>

        <p><a href="#" class="bright-link" v-on:click="skipImportClick">Confirm your PACS Import</a></p>
      </div>

    </div>

    <div id="app-right">
      <div class="file-header">
        <table width="100%">
          <tr>
            <td width="10%"><div id="breadcrumbs"><a href="#" v-on:click="upDirectoryClick"><i class=" ti-angle-left"></i> {{fileSystem[0].path}}</a> </div></td>
            <td width="70%"></td>
            <td width="20%" align="center"></td>
          </tr>
        </table>
      </div>
      <div class="app-right-content">
        <div class="file-list-row">
          <div id="file-row" v-for="item in currentDirContents" v-bind:class="{'chosen-file':(item.path==currentFileSystemPath)}" v-on:click="dirItemClick(item)" v-on:dblclick="dirDoubleClick()">
              <div v-if="item.type === 'dir'" class="file-icon folder"></div>
              <div v-else-if="item.type ==='file'" class="file-icon dicom"></div>
              <div class="file-name">{{item.text}}</div>
          </div>
        </div>
      </div>

    </div>

    <div class="step-btns-bar">
      <button class="btn-norm" v-on:click="nextTabClick">Import Data</button>
    </div>

  </div>
</template>

<script>

  var parser = new DOMParser();
  var x2J = require('./xmlToJson.js');
  var ctpService = require('./ctpService');

  export default {
    name: 'import',
    props:['currentFileSystemPath', 'alreadyImported'],
    created() {
      this.updateAvailableServerSpace();
      this.updateFileSystemTree("/");
    },
    methods: {
      nextTabClick: function(){
        console.log("nextTabClick");
        this.$root.$emit('nextTab', 'Import');
      },
      skipImportClick: function(){
        console.log("skipImportClick");
        this.$emit('update:alreadyImported', true);
        this.$root.$emit('nextTab', 'Import');
      },
      dirItemClick: function (item) {
        this.currentFileSystemPath = item.path;
        this.currentPathIsDir = (item.type == "dir" ?  true: false);
        console.log("dirItemClick -  currentFileSystemPath: " + this.currentFileSystemPath);
        this.$emit('update:currentFileSystemPath', this.currentFileSystemPath);
      },
      dirDoubleClick: function() {
        console.log("dirDoubleClick");
        if (this.currentPathIsDir) {
          this.updateFileSystemTree(this.currentFileSystemPath);
        }
      },
      upDirectoryClick: function(){
        this.updateFileSystemTree(this.fileSystem[0].parent);
      },
      getSystemFileRoots: function(){
        this.$http.get('/Collection/getFileSystemRoots').then(response=>{
          console.log(response.body);

          var xml = parser.parseFromString(response.body, "text/xml");
          var json = x2J.rootsXmlToJson(xml);
          console.log(json);
          this.fileSystem = json.children;
          console.log("fileSystem: " + this.fileSystem);
          this.currentDirContents = this.fileSystem;
          console.log("currentDirContents: " + this.currentDirContents);
        }, response=>{
          this.$root.$emit('addError', 'Error retrieving the system file roots');
        });
      },
      updateFileSystemTree: function(path){

        debugger;
        console.log("method updateFileSystemTree");
        console.log("path: " + path);

        if (!path) {
          this.getSystemFileRoots();
        }
        else {
          this.$http.get('/Collection/listFiles?dir=' + path + '&dcm').then(response => {
            console.log("listFiles: ");
            console.log(response.body);
            var xml = parser.parseFromString(response.body, "text/xml");
            console.log(xml);
            var json = x2J.fileSystemXmlToJson(xml);

            console.log(json);
            this.fileSystem = json.children;
            if (this.fileSystem[0].children)
              this.currentDirContents = this.fileSystem[0].children;
            else
              this.currentDirContents = this.fileSystem[0];
            console.log(this.currentDirContents);
          }, response => {
            console.log("error calling listFiles");
            this.$root.$emit('addError', 'There was a problem retrieving directory information.');
          });

        }
      },
      updateAvailableServerSpace: function () {
        // <space partition="D:\" available="434932" units="MB"/>
        this.$http.get('/Collection/getAvailableSpace').then(response => {
          console.log("getAvailableSpace: ");
          console.log(response.body);
          var xml = parser.parseFromString(response.body, "text/xml");
          console.log(xml);
          var partition = xml.getElementsByTagName("space")[0].getAttribute("partition");
          var available = xml.getElementsByTagName("space")[0].getAttribute("available");
          var units = xml.getElementsByTagName("space")[0].getAttribute("units");

          this.serverSpace = available + " " + units + " available on " + partition;
        }, response=> {
          this.$root.$emit('addError', 'There was a problem finding the available server space.');
        });
      },

    },
    data: function() {
      return {
        loggedIn: false,
        serverSpace: "0",
        currentPathIsDir: true,
        currentDirContents : [],
        fileSystem: [{
          "text": "Retrieving directory information",
          "opened": true,
          "icon": "ti-alert"
        }]
      }
    }
  }
</script>

<style lang="scss" scoped>

  #breadcrumbs {
    color: #fff;
    font-size: 11px;
    line-height: 11px;
    font-weight: 500;
    white-space: nowrap;
  }

  #breadcrumbs a {
    color: #333 !important;
    text-decoration: none;

  }

  #breadcrumbs a:hover {
    color: #333;

  }

  .bright-link{
    color: #5CB9F0 !important;
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

  .file-icon {
    background-position: right;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .file-icon-child {
    background-position: right;
    background-repeat: no-repeat;
    background-size: contain;
  }
  .folder-closed {

    background-position: left;
    background-repeat: no-repeat;
    background-size: contain;
  }

  .child {
    background-position: right;
  }


  .dicom {
      background-image: url(assets/file-icons/filetype-dcm.png);
  }

  .generic {
    background-image: url(assets/file-icons/filetype-blank.png);
  }

  .folder {
    background-image: url(assets/file-icons/filetype-folder2.png);
  }

  .folder-open {
    background-image: url(assets/file-icons/filetype-folder.png);
  }

  .results-list-row {
    padding: 10px;
    overflow-y: scroll;
    height:250px;
  }

  .results-list-row table tr td {
    font-size: 22px;
  }



  #file-row {
    width: 100%;
    height: 50px;
    padding-top: 7px;
    border-bottom: 1px #e9e9e9 solid;
  }


  #file-row:hover {
    background-color: #f5f5f5;
  }
  #file-row:hover.chosen-file {
    background-color: bisque;
  }
  .chosen-file {
    background-color: bisque;
  }

  .file-name, .file-size, .file-icon {
    float: left;
    font-size: 12px;
    height: 35px;
    line-height: 40px;
  }

  .file-icon {
    width: 40px;
  }

  .file-name {
    max-width: 300px;
    padding-left: 10px;
    height: 40px;
  }

  .file-size {
    float: right;
    text-align: center;
    width: 20%;
  }


</style>
