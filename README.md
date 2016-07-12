# Custom Static pages for NodeBB

Allows you to add as many new pages as you like to your NodeBB forum. New routes get added to the header automatically. Each new page has four widget areas (header, footer, content, and sidebar) which you can use to add HTML to in the Widgets ACP.

After creating or removing a new route, you have to restart NodeBB in order for the route to be registered.

**New in 0.7x: Routes are no longer automatically added to the header. If you want to add an icon/text link to the header to your new route, visit General -> Navigation and use the drag and drop interface to do so.**

## Installation

    npm install nodebb-plugin-custom-pages

## TODO

* Move all widgets to draft zone if you delete a static page
