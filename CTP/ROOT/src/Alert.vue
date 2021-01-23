<template>
  <div>
    <div class="alert" v-for="error in errors">
      <span class="closebtn" onclick="this.parentElement.style.display='none';">&times;</span>
      <div class="alert-message">{{error}}</div>
    </div>
  </div>
</template>


<script>

  export default {
    name: 'alert',
    props: ['errors']
  }
</script>


<style lang="scss">

  .closebtn {
    margin-top: 10px;
    margin-right: 25px;
    color: white;
    font-weight: bold;
    float: right;
    font-size: 25px;
    line-height: 20px;
    cursor: pointer;
    transition: 0.3s;
  }

  .closebtn:hover {
    color: black;
  }

  .alert{
    position: absolute;
    z-index: 101;
    top: 0;
    left: 0;
    right: 0;
    background: #FDA02C;
    text-align: center;
    line-height: 2.5;
    overflow: hidden;
    -webkit-box-shadow: 0 0 5px black;
    -moz-box-shadow:    0 0 5px black;
    box-shadow:         0 0 5px black;
  }


</style>
