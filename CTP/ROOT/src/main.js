import Vue from 'vue'
import App from './App.vue'

import VueResource from 'vue-resource'

import VueFormWizard from 'vue-form-wizard'
import 'vue-form-wizard/dist/vue-form-wizard.min.css'

// import VModal from 'vue-js-modal'


Vue.use(VueFormWizard)
Vue.use(VueResource)
//Vue.use(VModal, { dialog: true })


new Vue({
  el: '#app',
  render: h => h(App)
})


