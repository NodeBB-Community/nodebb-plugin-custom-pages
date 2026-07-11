<div class="acp-page-container">
	<div component="settings/main/header" class="row border-bottom py-2 m-0 sticky-top acp-page-main-header align-items-center">
        <div class="col-12 col-md-8 px-0 mb-1 mb-md-0">
            <h4 class="fw-bold tracking-tight mb-0">{{tx("custom-pages:custom-pages")}}</h4>
        </div>
        <div class="col-12 col-md-4 px-0 px-md-3 d-flex gap-1">
            <button id="add" class="btn btn-light btn-sm fw-semibold ff-secondary w-100 text-center text-nowrap"><i class="fa fa-plus text-primary"></i> {{tx("admin/admin:add")}}</button>
            <button id="save" class="btn btn-primary btn-sm fw-semibold ff-secondary w-100 text-center text-nowrap">{{tx("admin/admin:save-changes")}}</button>
        </div>
    </div>

	<div class="row m-0">
		<div id="spy-container" class="col-12 px-0 mb-4" tabindex="0">
            <p class="lead">
                {{tx("custom-pages:intro")}}
            </p>
            <p>
                {{tx("custom-pages:add-content-info", config.relative_path)}}
            </p>
            <p>
                {{tx("custom-pages:navigation-info", config.relative_path)}}
            </p>
            <p>
                {{tx("custom-pages:homepage-info", config.relative_path)}}
            </p>

            <div id="custom-pages">
                {{{ each pages }}}
                <div class="card card-body text-bg-light">
                    <form>
                        <span class="float-end"><i class="fa fa-times pointer"></i></span>
                        <div class="mb-3">
                            <label>{{tx("custom-pages:page-title")}}
                            <input type="text" class="form-control" name="name" value="{./name}" placeholder="{{tx("custom-pages:page-title")}}" />
                            </label>

                            <label>{{tx("custom-pages:path-to-page")}}
                            <input type="text" class="form-control" name="route" value="{./route}" placeholder="/my-page" />
                            </label>
                        </div>

                        <div>
                            <label class="form-label">{{tx("custom-pages:restrict-groups")}}</label>
                        </div>
                        <input type="text" class="form-control groups-list" name="groups" value="{./groups}" placeholder="" />
                    </form>
                </div>
                {{{ end }}}
            </div>
        </div>
    </div>
</div>

<div class="template card card-body text-bg-light hidden">
    <form>
        <span class="float-end"><i class="fa fa-times pointer"></i></span>
        <div class="mb-3">
            <label>{{tx("custom-pages:page-title")}}
            <input type="text" class="form-control" name="name" value="" placeholder="{{tx("custom-pages:page-title")}}" />
            </label>

            <label>{{tx("custom-pages:path-to-page")}}
            <input type="text" class="form-control" name="route" value="" placeholder="/my-page" />
            </label>
        </div>

        <div>
        <label class="form-label">{{tx("custom-pages:restrict-groups")}}</label>
        </div>
        <input type="text" class="form-control groups-list" name="groups" value="" placeholder="" />
    </form>
</div>
