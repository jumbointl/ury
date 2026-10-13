import './index.css';
import { createApp, reactive } from "vue";
import App from "./App.vue";

import router from './router';

import { t, kotType } from './i18n';

const app = createApp(App);
app.config.globalProperties.$t = t;
app.config.globalProperties.$kotType = kotType;

// Plugins
app.use(router);

// Global Properties,
// components can inject this

// Configure route gaurds
router.beforeEach(async (to, from, next) => {
	next();
});

app.mount("#app");
