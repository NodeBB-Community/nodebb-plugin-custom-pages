# Custom Pages for NodeBB

Allows you to add as many new pages as you like to your NodeBB forum. Each new page has four widget areas (header, footer, content, and sidebar) which you can use to add HTML to in the Widgets ACP.

### Tips

* You can set custom permissions for each individual page (ex. group-level access, or registered users only access, etc).
* Use NodeBB's widget system (Extend -> Widgets) to add any type of content.
* Utilize [benchpress](https://github.com/benchpressjs/benchpressjs) markup for advanced logic.
* Add a navigation link in the header that points to your custom page in General -> Navigation and selecting "Custom Route".
* Make a custom page your landing page / homepage under General -> Homepage and selecting "Custom"

## Manual Installation

    npm install nodebb-plugin-custom-pages