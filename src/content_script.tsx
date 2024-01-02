import 'mv3-hot-reload/content';

import * as React from 'react';
import { createRoot } from 'react-dom/client';

const rootDom = document.createElement('div');
(rootDom as any).id = 'sample';
(rootDom as any).style = 'z-index: 1000000';
document.body.insertBefore(rootDom, document.body.firstChild);

const root = createRoot(document.getElementById('sample'));
root.render(<h1>React is here!</h1>, root);
