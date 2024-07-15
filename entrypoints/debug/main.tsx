import { render } from 'solid-js/web';

import '@/assets/tailwind.css';
import App from './App';

// biome-ignore lint/style/noNonNullAssertion: See <./index.html>
render(() => <App />, document.getElementById('root')!);
