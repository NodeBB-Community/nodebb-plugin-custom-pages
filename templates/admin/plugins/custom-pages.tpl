<div class="row">
    <div class="col-sm-2 col-12 settings-header">Active Routes</div>
    <div class="col-sm-10 col-12">
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
            If you wish to set a custom page as your homepage, go to <a href="{config.relative_path}/admin/general/homepage">General &rarr; Homepage</a> and select "Custom".
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

<div class="floating-button">
    <button id="add" class="success mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
        <i class="material-icons">note_add</i>
    </button>
    <button id="save" class="primary btn-primary mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--colored">
        <i class="material-icons">save</i>
    </button>
</div>