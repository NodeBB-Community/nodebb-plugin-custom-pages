<div class="acp-page-container">
	<div component="settings/main/header" class="row border-bottom py-2 m-0 sticky-top acp-page-main-header align-items-center">
        <div class="col-12 col-md-8 px-0 mb-1 mb-md-0">
            <h4 class="fw-bold tracking-tight mb-0">{title}</h4>
        </div>
        <div class="col-12 col-md-4 px-0 px-md-3 d-flex gap-1">
            <button id="add" class="btn btn-light btn-sm fw-semibold ff-secondary w-100 text-center text-nowrap"><i class="fa fa-plus text-primary"></i> [[admin/admin:add]]</button>
            <button id="save" class="btn btn-primary btn-sm fw-semibold ff-secondary w-100 text-center text-nowrap">[[admin/admin:save-changes]]</button>
        </div>
    </div>

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
            <p class="lead">
                Define and customise your new routes here.
            </p>
            <p>
               You can add content to your new routes from <a href="{config.relative_path}/admin/extend/widgets">Extend &rarr; Widgets</a>.
            </p>
            <p>
                You can add your new route to the site navigation from <a href="{config.relative_path}/admin/general/navigation">General &rarr; Navigation</a> and select "Custom Route".
            </p>
            <p>
                If you wish to set a custom page as your homepage, go to <a href="{config.relative_path}/admin/settings/general#home-page">General &rarr; Homepage</a> and select "Custom".
            </p>

            <div id="custom-pages">
                <!-- BEGIN pages -->
                <div class="card card-body text-bg-light">
                    <form>
                        <span class="float-end"><i class="fa fa-times pointer"></i></span>
                        <div class="mb-3">
                            <label>Page Title
                            <input type="text" class="form-control" name="name" value="{pages.name}" placeholder="Page Title" />
                            </label>

                            <label>Path to Page
                            <input type="text" class="form-control" name="route" value="{pages.route}" placeholder="/my-page" />
                            </label>
                        </div>

                        <div>
                            <label class="form-label">Restrict access to groups (leave blank for public):</label>
                        </div>
                        <input type="text" class="form-control groups-list" name="groups" value="{pages.groups}" placeholder="" />
                    </form>
                </div>
                <!-- END pages -->
            </div>
        </div>
    </div>
</div>

<div class="template card card-body text-bg-light hidden">
    <form>
        <span class="float-end"><i class="fa fa-times pointer"></i></span>
        <div class="mb-3">
            <label>Page Title
            <input type="text" class="form-control" name="name" value="" placeholder="Page Title" />
            </label>

            <label>Path to Page
            <input type="text" class="form-control" name="route" value="" placeholder="/my-page" />
            </label>
        </div>

        <div>
        <label class="form-label">Restrict access to groups (leave blank for public):</label>
        </div>
        <input type="text" class="form-control groups-list" name="groups" value="" placeholder="" />
    </form>
</div>
