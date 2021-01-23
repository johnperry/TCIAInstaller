<template>
  <div class="modal-mask">
    <div class="modal-wrapper">
      <div class="modal-container">

        <p class="modal-body">
          Shut down CTP?
        </p>

        <div class="modal-footer">

          <button class="btn-norm" @click="$emit('close')">
            Keep CTP running
          </button>
          <button class="btn-norm" v-on:click="shutDownCTP">
            Shut down
          </button>
        </div>

      </div>
    </div>
  </div>

</template>


<script>

  export default {
    name: 'shut-down-modal',
    methods: {
      shutDownCTP: function(){
        console.log("close modal");
        this.$emit('close');
        console.log("sending shutdown CTP command");
        this.$http.get('/shutdown').then(response=>{
          console.log("CTP shutdown complete.");
        }, response =>{
          this.errorMessages.push("Failed to shutdown CTP.")
        });
      }
    }
  }
</script>


<style lang="scss" scoped>

  .modal-mask {
    position: fixed;
    z-index: 9998;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, .5);
    display: table;
    transition: opacity .3s ease;
  }

  .modal-wrapper {
    display: table-cell;
    vertical-align: middle;
  }

  .modal-container {
    width: 300px;
    margin: 0px auto;
    padding: 20px 30px 50px;
    background-color: #f9f9f9;
    color: #444444;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .33);
    transition: all .3s ease;
    font-family: Helvetica, Arial, sans-serif;
  }

  .modal-header h3 {
    margin-top: 0;
    color: #42b983;
  }

  .modal-body {
    //margin: 20px;
  }

  .modal-default-button {
    float: right;
  }

  .btn-norm {
    margin-left: 5px;
    margin-right: 10px;
  }

  /*
   * The following styles are auto-applied to elements with
   * transition="modal" when their visibility is toggled
   * by Vue.js.
   *
   * You can easily play with the modal transition by editing
   * these styles.
   */

  .modal-enter {
    opacity: 0;
  }

  .modal-leave-active {
    opacity: 0;
  }

  .modal-enter .modal-container,
  .modal-leave-active .modal-container {
    -webkit-transform: scale(1.1);
    transform: scale(1.1);
  }

</style>

