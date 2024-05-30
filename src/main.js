import { createApp } from 'vue'
import App2 from './App2.vue'
import '@arcgis/core/assets/esri/themes/light/main.css';
import esriConfig from "@arcgis/core/config";
esriConfig.assetsPath = "assets";
esriConfig.fontsUrl = "fonts";

createApp(App2).mount('#app')
