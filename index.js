/**
 * index.js - Ilovaning eng birinchi ishga tushadigan fayli
 *
 * registerRootComponent App komponentini telefonning "ildiz" ko'rinishiga
 * ulaydi. U AppRegistry.registerComponent ni ham chaqiradi, shuning uchun
 * ilova Expo Go'da ham, yig'ilgan APK'da ham bir xil ishlaydi.
 */

import { registerRootComponent } from 'expo';

import App from './App';

registerRootComponent(App);
