import React from 'react';
import ReactDOM from 'react-dom';

const root = document.createElement('div');
(root as any).style = "z-index: 1000000";
document.body.insertBefore(root, document.body.firstChild);
ReactDOM.render(<h1>React is here!</h1>, root);

