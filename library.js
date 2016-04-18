"use strict";

var plugin = {},
	db = module.parent.require('./database'),
	nconf = module.parent.require('nconf'),
	async = module.parent.require('async'),
	mkdirp = module.parent.require('mkdirp');

var	fs = require('fs'),
	path = require('path');

function renderCustomPage(req, res, next) {
	var path = req.path.replace(/\/(api\/)?/, '');
	res.render(path, {
		title: plugin.pagesHash[path].name
	});
}

function renderAdmin(req, res, next) {
	getCustomPages(function(err, data) {
		res.render('admin/custom-pages', {
			pages: data
		});
	});
}

function getCustomPages(callback) {
	if (plugin.pagesCache) {
		return callback(null, plugin.pagesCache);
	} else {
		db.get('plugins:custom-pages', function(err, data) {
			try {
				var pages = JSON.parse(data);

				if (pages == null) {
					pages = [];
				}

				// Eliminate errors in route definition
				plugin.pagesCache = pages.map(function(pageObj) {
					pageObj.route = pageObj.route.replace(/^\/*/g, '');	// trim leading slashes from route
					return pageObj;
				});

				plugin.pagesHash = plugin.pagesCache.reduce(function(memo, cur) {
					memo[cur.route] = cur;
					return memo;
				}, {});

				callback(null, plugin.pagesCache);
			} catch (err) {
				callback(err);
			}
		});
	}
}

plugin.setAvailableTemplates = function(templates, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				templates.push(data[d].route + '.tpl');
			}
		}

		callback(err, templates);
	});
};

plugin.setWidgetAreas = function(areas, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				areas = areas.concat([
					{
						'name': data[d].name + ' Header',
						'template': data[d].route + '.tpl',
						'location': 'header'
					},
					{
						'name': data[d].name + ' Footer',
						'template': data[d].route + '.tpl',
						'location': 'footer'
					},
					{
						'name': data[d].name + ' Sidebar',
						'template': data[d].route + '.tpl',
						'location': 'sidebar'
					},
					{
						'name': data[d].name + ' Content',
						'template': data[d].route + '.tpl',
						'location': 'content'
					}
				]);
			}
		}

		callback(err, areas);
	});
};

plugin.addAdminNavigation = function(header, callback) {
	header.plugins.push({
		route: '/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Static Pages'
	});

	callback(null, header);
};

plugin.addNavigation = function(header, callback) {
	getCustomPages(function(err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				header.navigation.push({
					"class": data[d].class,
					"route": "/" + data[d].route,
					"text": data[d].name,
					"title": data[d].name
				});
			}
		}

		callback(null, header);
	});
};

plugin.init = function(params, callback) {
	var app = params.router,
		middleware = params.middleware,
		controllers = params.controllers,
		helpers = module.parent.require('./routes/helpers');
		
	app.get('/admin/custom-pages', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/custom-pages', renderAdmin);

	fs.readFile(path.join(__dirname, 'templates/custom-page.tpl'), function(err, customTPL) {
		customTPL = customTPL.toString();

		getCustomPages(function(err, pages) {
			async.each(pages, function(pageObj, next) {
				var route = pageObj.route;
				helpers.setupPageRoute(app, '/' + route, middleware, [], renderCustomPage);

				if (path.dirname(route) !== '.') {
					// Subdirectories specified
					mkdirp(path.join(nconf.get('views_dir'), path.dirname(route)), function(err) {
						if (err) {
							return next(err);
						}

						fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL, next);
					});
				} else {
					fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL, next);
				}
			});
		});
	});

	var SocketAdmin = module.parent.require('./socket.io/admin');
	SocketAdmin.settings.saveCustomPages = function(socket, data, callback) {
		delete plugin.pagesCache;
		delete plugin.pagesHash;

		db.set('plugins:custom-pages', JSON.stringify(data), callback);
	};

	callback();
};

module.exports = plugin;
