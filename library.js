'use strict';

var plugin = {};
var db = module.parent.require('./database');
var hotswap = module.parent.require('./hotswap');
var user = module.parent.require('./user');
var widgets = module.parent.require('./widgets');
var groups = module.parent.require('./groups');
var controllerHelpers = module.parent.require('./controllers/helpers');

var nconf = module.parent.require('nconf');
var async = module.parent.require('async');
var mkdirp = module.parent.require('mkdirp');
var winston = module.parent.require('winston');
var express = module.parent.require('express');
var middleware;

var	fs = require('fs');
var path = require('path');

function renderCustomPage(req, res, next) {
	var path = req.path.replace(/\/(api\/)?/, '').replace(/\/$/, '');
	var groupList = (plugin.pagesHash[path].groups || '').split(',');

	async.waterfall([
		function (next) {
			user.isAdministrator(req.uid, next);
		},
		function (isAdministrator, next) {
			if (!groupList.length || isAdministrator) {
				return next(null, [true]);
			}

			groups.isMemberOfGroups(req.uid, groupList, next);
		},
		function (groupMembership, next) {
			if (!groupMembership.some(function (a) { return a; })) {
				return controllerHelpers.notAllowed(req, res);
			}

			next();
		},
	], function (err) {
		if (err) {
			return next(err);
		}

		user.getUsers([req.uid], req.uid, function (err, user) {
			if (err) {
				return next(err);
			}

			res.render(path, {
				title: plugin.pagesHash[path].name,
				user: user[0],
			});
		});
	});
}

function renderAdmin(req, res, next) {
	async.parallel({
		pages: function (next) {
			getCustomPages(next);
		},
		groups: function (next) {
			getGroupList(next);
		},
	}, function (err, data) {
		if (err) {
			return next(err);
		}

		res.render('admin/plugins/custom-pages', {
			pages: data.pages,
			groups: data.groups,
		});
	});
}

function getCustomPages(callback) {
	if (plugin.pagesCache) {
		return callback(null, plugin.pagesCache);
	}

	db.get('plugins:custom-pages', function (err, data) {
		if (err) {
			return callback(err);
		}

		try {
			var pages = JSON.parse(data);

			if (pages == null) {
				pages = [];
			}

			// Eliminate errors in route definition
			plugin.pagesCache = pages.map(function (pageObj) {
				pageObj.route = pageObj.route.replace(/^\/*/g, '');	// trim leading slashes from route
				return pageObj;
			});

			plugin.pagesHash = plugin.pagesCache.reduce(function (memo, cur) {
				memo[cur.route] = cur;
				return memo;
			}, {});

			callback(null, plugin.pagesCache);
		} catch (err) {
			callback(err);
		}
	});
}

function getGroupList(callback) {
	var list = [];

	groups.getGroups('groups:createtime', 0, -1, function (err, groups) {
		groups.forEach(function (group) {
			if ((group.match(/cid:([0-9]*):privileges:groups:([\s\S]*)/)) === null) {
				list.push(group);
			}
		});

		callback(err, list);
	});
}

plugin.prepare = function (hotswapIds, callback) {
	hotswapIds.push('custom-pages');
	callback(null, hotswapIds);
};

plugin.setAvailableTemplates = function (templates, callback) {
	getCustomPages(function (err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				templates.push(data[d].route + '.tpl');
			}
		}

		callback(err, templates);
	});
};

plugin.setWidgetAreas = function (areas, callback) {
	getCustomPages(function (err, data) {
		for (var d in data) {
			if (data.hasOwnProperty(d)) {
				areas = areas.concat([
					{
						name: data[d].name + ' Header',
						template: data[d].route + '.tpl',
						location: 'header',
					},
					{
						name: data[d].name + ' Footer',
						template: data[d].route + '.tpl',
						location: 'footer',
					},
					{
						name: data[d].name + ' Sidebar',
						template: data[d].route + '.tpl',
						location: 'sidebar',
					},
					{
						name: data[d].name + ' Content',
						template: data[d].route + '.tpl',
						location: 'content',
					},
				]);
			}
		}

		callback(err, areas);
	});
};

plugin.addAdminNavigation = function (header, callback) {
	header.plugins.push({
		route: '/plugins/custom-pages',
		icon: 'fa-mobile',
		name: 'Custom Pages',
	});

	callback(null, header);
};

plugin.init = function (params, callback) {
	var app = params.router;

	middleware = params.middleware;

	app.get('/admin/plugins/custom-pages', middleware.admin.buildHeader, renderAdmin);
	app.get('/api/admin/plugins/custom-pages', renderAdmin);

	var SocketAdmin = module.parent.require('./socket.io/admin');
	SocketAdmin.settings.saveCustomPages = function (socket, data, callback) {
		resetWidgets(data);

		delete plugin.pagesCache;
		delete plugin.pagesHash;

		async.series([
			async.apply(db.set, 'plugins:custom-pages', JSON.stringify(data)),
			async.apply(plugin.reloadRoutes),
		], callback);
	};

	plugin.reloadRoutes(callback);
};

plugin.reloadRoutes = function (callback) {
	var pagesRouter = express.Router();
	var helpers = module.parent.require('./routes/helpers');

	pagesRouter.hotswapId = 'custom-pages';

	fs.readFile(path.join(__dirname, 'templates/custom-page.tpl'), function (err, customTPL) {
		if (err) {
			return callback(err);
		}

		customTPL = customTPL.toString();

		getCustomPages(function (err, pages) {
			if (err) {
				return callback(err);
			}

			async.each(pages, function (pageObj, next) {
				var route = pageObj.route;
				helpers.setupPageRoute(pagesRouter, '/' + route, middleware, [], renderCustomPage);

				if (path.dirname(route) !== '.') {
					// Subdirectories specified
					mkdirp(path.join(nconf.get('views_dir'), path.dirname(route)), function (err) {
						if (err) {
							return next(err);
						}

						fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL, next);
					});
				} else {
					fs.writeFile(path.join(nconf.get('views_dir'), route + '.tpl'), customTPL, next);
				}
			}, function (err) {
				if (err) {
					winston.error('[plugin/custom-pages] Could not re-initialise routes!');
					winston.error('  ' + err.message);
					return callback(err);
				}

				hotswap.replace('custom-pages', pagesRouter);
				callback();
			});
		});
	});
};

function resetWidgets(data, callback) {
	var removedRoutes = [];
	Object.keys(plugin.pagesHash).forEach(function (route) {
		var match = data.find(function (page) {
			return page.route === route;
		});

		if (!match) {
			removedRoutes.push(route);
		}
	});

	widgets.resetTemplates(removedRoutes, callback);
}

module.exports = plugin;
