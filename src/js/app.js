import domLoad from './dom-load';
import windowLoad from './window-load';

// The DOMContentLoaded event fires when parsing of the current page is complete. DOMContentLoaded is a great event to use to hookup UI functionality to complex web pages.
document.addEventListener('DOMContentLoaded', domLoad, false);

// The load event fires when all files have finished loading from all resources, including ads and images.
window.addEventListener('load', windowLoad, false);
